const chat = document.getElementById("chat"); 
const input = document.getElementById("input");
const send = document.getElementById("send");

const API_KEY = "platinumai";  
let messages = [];

// --- Fingerprint function ---
async function getFingerprint() {
    function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return(h>>>0).toString(16);}
    function canvasFP(){const c=document.createElement('canvas');const ctx=c.getContext('2d');ctx.font='16px Arial';ctx.fillText('fp-demo',2,2);ctx.fillRect(50,10,100,20);return c.toDataURL();}
    function webglFP(){const c=document.createElement('canvas');const gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl)return'';const dbg=gl.getExtension('WEBGL_debug_renderer_info');return[gl.getParameter(gl.VERSION),gl.getParameter(gl.VENDOR),gl.getParameter(gl.RENDERER),dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):'',dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):''].join('|');}
    async function audioFP(){return new Promise(resolve=>{const AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!AC)return resolve('');const ctx=new AC(1,44100,44100);const osc=ctx.createOscillator();const anl=ctx.createAnalyser();osc.connect(anl);anl.connect(ctx.destination);osc.start(0);ctx.startRendering().then(buf=>resolve(buf.getChannelData(0).slice(0,1000).reduce((a,b)=>a+b,0).toString())).catch(()=>resolve(''));});}
    function browserInfo(){return[navigator.userAgent,screen.width,screen.height,screen.colorDepth,Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');}
    const combined=[hash(canvasFP()),hash(webglFP()),hash(await audioFP()),hash(browserInfo())].join('|');
    return hash(combined);
}

// --- Chance system helpers ---
const CHANCES_KEY_PREFIX = "platinum_chances_"; // localStorage key prefix

function getRemainingChances(fingerprint) {
    const key = CHANCES_KEY_PREFIX + fingerprint;
    const val = localStorage.getItem(key);
    if (val === null) return 2; // default 2 chances
    return parseInt(val, 10);
}

function useChance(fingerprint) {
    const key = CHANCES_KEY_PREFIX + fingerprint;
    let remaining = getRemainingChances(fingerprint);
    remaining = Math.max(0, remaining - 1);
    localStorage.setItem(key, remaining);
    return remaining;
}

// --- Add message to chat ---
function addMessage(role, content, think = null) {
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const messageContent = document.createElement('div');

    if (think) {
        const thinkContainer = document.createElement('div');
        thinkContainer.className = 'think-container';
        thinkContainer.innerHTML = 'AI is thinking... (click to expand)';

        const thinkContent = document.createElement('div');
        thinkContent.className = 'think-content';
        thinkContent.textContent = think;

        thinkContainer.appendChild(thinkContent);
        thinkContainer.addEventListener('click', () => thinkContainer.classList.toggle('open'));

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(thinkContainer);

        const responseDiv = document.createElement('div');
        responseDiv.className = 'message-content';
        responseDiv.textContent = content;
        messageDiv.appendChild(responseDiv);
    } else {
        if (content === "Typing...") {
            messageContent.className = 'typing-indicator';
            messageContent.innerHTML = `
                <span>AI is typing</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>`;
        } else {
            messageContent.className = 'message-content';
            messageContent.textContent = content;
        }
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
    }

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

// --- Show error ---
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chat.appendChild(errorDiv);
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => errorDiv.remove(), 5000);
}

// --- Auto-resize input ---
function autoResize() {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
}

// --- Check server ban on page load ---
document.addEventListener('DOMContentLoaded', async () => {
    const fingerprint = await getFingerprint();
    try {
        const resp = await fetch('/api/check-ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint }),
            credentials: 'same-origin'
        });
        const data = await resp.json();
        if (data.banned) {
            window.location.href = '/blocked';
            return;
        }
    } catch (err) {
        console.error('Failed to check ban:', err);
    }
    input.focus();
});

// --- Send message ---
async function sendMessage() {
    const userInput = input.value.trim();
    if (!userInput) return;

    // --- Load blocked terms ---
    let blocked = [];
    try {
        const response = await fetch("/assets/data/block.json");
        blocked = await response.json();
    } catch (err) {
        console.error("Failed to load blocked terms:", err);
    }

    const isBlocked = blocked.some(term => userInput.toLowerCase().includes(term.toLowerCase()));
    const fingerprint = await getFingerprint();

    if (isBlocked) {
        const remaining = useChance(fingerprint);
        if (remaining > 0) {
            showError(`You violated the TOS! You have ${remaining} chance(s) left.`);
            input.value = "";
            autoResize();
            return; // do NOT send to AI
        } else {
            try {
                await fetch('/api/ban', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprint, uuid: null, ip: null })
                });
                window.location.href = '/blocked';
                return;
            } catch(err) {
                console.error('Failed to ban user:', err);
                showError('You triggered a blocked word.');
                return;
            }
        }
    }

    // --- Send to AI ---
    addMessage("user", userInput);
    messages.push({ role: "user", content: userInput });
    input.value = "";
    autoResize();

    send.disabled = true;
    addMessage("assistant", "Typing...");

    try {
        const res = await fetch("https://api.mathkits.org/myapi/chat", {
            method: "POST",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages })
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const fullText = data.choices?.[0]?.message?.content || "(No response)";

        const typing = chat.querySelector(".assistant:last-child");
        if (typing && typing.querySelector('.typing-indicator')) typing.remove();

        const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
        const thinkText = thinkMatch ? thinkMatch[1].trim() : null;
        const contentText = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trim();

        messages.push({ role: "assistant", content: contentText });
        addMessage("assistant", contentText, thinkText);

    } catch (error) {
        console.error('Error:', error);
        const typing = chat.querySelector(".assistant:last-child");
        if (typing && typing.querySelector('.typing-indicator')) typing.remove();
        showError('Sorry, I encountered an error. Please try again.');
    } finally {
        send.disabled = false;
    }
}

// --- Event listeners ---
send.onclick = sendMessage;
input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
input.addEventListener('input', autoResize);
