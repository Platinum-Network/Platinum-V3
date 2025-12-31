const chat = document.getElementById("chat"); 
const input = document.getElementById("input");
const send = document.getElementById("send");

let messages = [];

// --- Clean raw AI response ---
function cleanAIResponse(raw) {
    let text = raw.replace(/^Here’s\s+.*?:\s*/, ''); // remove leading descriptions
    text = text.replace(/\s*Let me know.*$/, ''); // remove trailing notes
    return text.trim();
}

// --- Add message to chat with Markdown ---
function addMessage(role, content, think = null) {
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (window.marked && window.DOMPurify) {
        messageContent.innerHTML = DOMPurify.sanitize(marked.parse(content));
    } else {
        messageContent.textContent = content; // fallback plain text
    }

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
        messageDiv.appendChild(messageContent);
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

// --- Send message ---
async function sendMessage() {
    const userInput = input.value.trim();
    if (!userInput) return;

    // Add user message
    addMessage("user", userInput);
    messages.push({ role: "user", content: userInput });
    input.value = "";
    autoResize();

    send.disabled = true;
    addMessage("assistant", "Typing...");

    try {
        // Use premiumKey if exists, otherwise default to "platinumai"
        const premiumKey = localStorage.getItem("premiumKey") || "platinumai";
        const headers = { "Content-Type": "application/json", "x-api-key": premiumKey };

        const res = await fetch("https://api.mathkits.org/myapi/chat", {
            method: "POST",
            headers,
            body: JSON.stringify({ messages })
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || "(No response)";
        const cleanedText = cleanAIResponse(rawText);

        const typing = chat.querySelector(".assistant:last-child");
        if (typing && typing.querySelector('.typing-indicator')) typing.remove();

        const thinkMatch = cleanedText.match(/<think>([\s\S]*?)<\/think>/);
        const thinkText = thinkMatch ? thinkMatch[1].trim() : null;
        const contentText = cleanedText.replace(/<think>[\s\S]*?<\/think>/, '').trim();

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
