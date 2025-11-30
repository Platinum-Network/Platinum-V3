const uvDecode = document.getElementById('uvdecoder');
const uvDecodeButton = document.getElementById('decodeuv');
const sjDecode = document.getElementById('sjdecoder');
const sjDecodeButton = document.getElementById('decodesj');
const ecDecode = document.getElementById('ecdecoder');
const ecDecodeButton = document.getElementById('decodeec');
const apiBase = `${window.location.protocol}//${window.location.host}`;

function uvDecodeUrl(url) {
    return __uv$config.decodeUrl(url);
}
window.uvDecodeUrl = uvDecodeUrl;

function ecDecodeUrl(url) {
    return __eclipse$config.codec.encode(url);
}
window.ecDecodeUrl = ecDecodeUrl;

function sjDecodeUrl(url) {
    return decodeURIComponent(url);
}
window.sjDecodeUrl = sjDecodeUrl;

// Fix: add missing cleanURL()
function cleanURL(url) {
    return url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');
}

// Provider list including Cisco
const providers = [
    'lightspeed',
    'fortiguard',
    'palo',
    'blocksi',
    'blocksiai',
    'cisco',
    'linewize',
    'goguardian'
];

const displayNames = {
    cisco: 'Cisco Umbrella'
};

async function checkURL() {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';

    let url = document.getElementById('urlInput').value.trim();
    if (!url) return alert('Please enter a URL');

    url = cleanURL(url);

    const promises = providers.map(provider =>
        fetch(`${apiBase}/filters/${provider}/check/${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then(data => ({
                provider,
                blocked: data.blocked,
                category: data.category || 'Unknown'
            }))
            .catch(() => ({ provider, blocked: 'Error', category: null }))
    );

    const results = await Promise.all(promises);

    results.forEach(r => {
        const li = document.createElement('li');

        const name = displayNames[r.provider] || 
            (r.provider.charAt(0).toUpperCase() + r.provider.slice(1));

        li.textContent = name + ' - ';

        const status = document.createElement('span');

        if (r.blocked === true) {
            status.textContent = `Blocked (${r.category})`;
            status.style.color = '#f87171';
        } else if (r.blocked === false) {
            status.textContent = 'Not Blocked';
            status.style.color = '#34d399';
        } else {
            status.textContent = 'Error';
            status.style.color = '#9ca3af';
        }

        li.appendChild(status);
        resultsEl.appendChild(li);
    });
}

uvDecodeButton.addEventListener('click', () => {
    if (!uvDecode.value.trim()) return alert('Please enter a URL to decode.');
    uvDecode.value = window.uvDecodeUrl(uvDecode.value);
});

sjDecodeButton.addEventListener('click', () => {
    if (!sjDecode.value.trim()) return alert('Please enter a URL to decode.');
    sjDecode.value = window.sjDecodeUrl(sjDecode.value);
});

ecDecodeButton.addEventListener('click', () => {
    if (!ecDecode.value.trim()) return alert('Please enter a URL to decode.');
    ecDecode.value = window.ecDecodeUrl(ecDecode.value);
});
