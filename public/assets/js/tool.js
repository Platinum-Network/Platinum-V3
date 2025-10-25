const uvDecode = document.getElementById('uvdecoder');
const uvDecodeButton = document.getElementById('decodeuv');
const sjDecode = document.getElementById('sjdecoder');
const sjDecodeButton = document.getElementById('decodesj');
const ecDecode = document.getElementById('ecdecoder');
const ecDecodeButton = document.getElementById('decodeec');

function uvDecodeUrl(url) {
    const decodedUrl = __uv$config.decodeUrl(url);
    return decodedUrl;
}
window.uvDecodeUrl = uvDecodeUrl;

function ecDecodeUrl(url) {
    const decodedUrl = __eclipse$config.codec.encode(url);
    return decodedUrl;
}
window.uvDecodeUrl = uvDecodeUrl;

function sjDecodeUrl(url) {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl;
}
window.sjDecodeUrl = sjDecodeUrl;

const providers = ['lightspeed', 'fortiguard', 'palo', 'blocksi' ,"blocksiai"];

function cleanURL(url) {
    url = url.replace(/^https?:\/\//, ''); // remove protocol
    url = url.replace(/^www\./, '');       // remove www
    return url;
}

async function checkURL() {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = ''; // delete old results immediately

    let url = document.getElementById('urlInput').value.trim();
    if (!url) return alert('Please enter a URL');

    url = cleanURL(url);

    const promises = providers.map(provider =>
        fetch(`https://v2.mathkits.org/${provider}?url=${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then(data => ({ provider, blocked: data.blocked }))
            .catch(() => ({ provider, blocked: 'Error' }))
    );

    const results = await Promise.all(promises);

    results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r.provider.charAt(0).toUpperCase() + r.provider.slice(1);
        const statusSpan = document.createElement('span');

        if (r.blocked === true) {
            statusSpan.textContent = 'Blocked';
            statusSpan.style.color = '#f87171'; // red
        } else if (r.blocked === false) {
            statusSpan.textContent = 'Not Blocked';
            statusSpan.style.color = '#34d399'; // green
        } else {
            statusSpan.textContent = 'Error';
            statusSpan.style.color = '#9ca3af'; // gray
        }

        li.appendChild(statusSpan);
        resultsEl.appendChild(li);
    });
}

uvDecodeButton.addEventListener('click', () => {
    if (uvDecode.value === '' || uvDecode.value === null || uvDecode.value === " ") {
        alert('Please enter a URL to decode.');
        return;
    }
    var decodedURL = window.uvDecodeUrl(uvDecode.value);
    uvDecode.value = decodedURL;
});
sjDecodeButton.addEventListener('click', () => {
    if (sjDecode.value === '' || sjDecode.value === null || sjDecode.value === " ") {
        alert('Please enter a URL to decode.');
        return;
    }
    var decodedURL = window.sjDecodeUrl(sjDecode.value);
    sjDecode.value = decodedURL;
});
ecDecodeButton.addEventListener('click', () => {
    if (ecDecode.value === '' || ecDecode.value === null || ecDecode.value === " ") {
        alert('Please enter a URL to decode.');
        return;
    }
    var decodedURL = window.ecDecodeUrl(ecDecode.value);
    ecDecode.value = decodedURL;
});