document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("form");
	const input = document.getElementById("input");
	const input2 = document.getElementById("input2");

	let blockedTermsCache = null;
	let baremuxConnection = null;

	// === Helper: async-safe localStorage write ===
	function safeStore(key, value) {
		if ("requestIdleCallback" in window) {
			requestIdleCallback(() => localStorage.setItem(key, value));
		} else {
			setTimeout(() => localStorage.setItem(key, value), 10);
		}
	}

	// === BareMux init (only once per session) ===
	async function initBareMux() {
		try {
			if (baremuxConnection) return baremuxConnection;
			baremuxConnection = new BareMux.BareMuxConnection("/baremux/worker.js");
			const wispUrl =
				(location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";

			const transport = localStorage.getItem("transport") || "epoxy";
			localStorage.setItem("transport", transport);

			const expectedTransport =
				transport === "libcurl" ? "/libcurl/index.mjs" : "/epoxy/index.mjs";

			if ((await baremuxConnection.getTransport()) !== expectedTransport) {
				await baremuxConnection.setTransport(expectedTransport, [{ wisp: wispUrl }]);
				console.log(`Using ${transport} transport. Wisp URL: ${wispUrl}`);
			}
		} catch (err) {
			console.error("An error occurred while setting up BareMux:", err);
		}
	}

	// === Service Worker (register once if missing) ===
	async function initServiceWorker() {
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			if (!reg) {
				navigator.serviceWorker.register("/sw.js");
				console.log("Registering service worker...");
			}
		} catch (err) {
			console.error("Service worker registration failed:", err);
		}
	}

	// === Load blocklist with caching ===
	async function getBlockedTerms() {
		if (blockedTermsCache) return blockedTermsCache;
		try {
			const res = await fetch("/assets/data/block.json");
			blockedTermsCache = await res.json();
		} catch {
			blockedTermsCache = [
				"porn",
				"sex",
				"xxx",
				"hentai",
				"pornhub.com",
				"xxx.com",
				"4chan.org",
				"xvideos"
			];
		}
		return blockedTermsCache;
	}

	// === Fingerprint + Chance/Ban System ===
	const CHANCES_KEY_PREFIX = "platinum_chances_";

	async function getFingerprint() {
		function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return(h>>>0).toString(16);}
		function canvasFP(){const c=document.createElement('canvas');const ctx=c.getContext('2d');ctx.font='16px Arial';ctx.fillText('fp-demo',2,2);ctx.fillRect(50,10,100,20);return c.toDataURL();}
		function webglFP(){const c=document.createElement('canvas');const gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl)return'';const dbg=gl.getExtension('WEBGL_debug_renderer_info');return[gl.getParameter(gl.VERSION),gl.getParameter(gl.VENDOR),gl.getParameter(gl.RENDERER),dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):'',dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):''].join('|');}
		async function audioFP(){return new Promise(resolve=>{const AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!AC)return resolve('');const ctx=new AC(1,44100,44100);const osc=ctx.createOscillator();const anl=ctx.createAnalyser();osc.connect(anl);anl.connect(ctx.destination);osc.start(0);ctx.startRendering().then(buf=>resolve(buf.getChannelData(0).slice(0,1000).reduce((a,b)=>a+b,0).toString())).catch(()=>resolve(''));});}
		function browserInfo(){return[navigator.userAgent,screen.width,screen.height,screen.colorDepth,Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');}
		const combined=[hash(canvasFP()),hash(webglFP()),hash(await audioFP()),hash(browserInfo())].join('|');
		return hash(combined);
	}

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

	async function handleBlockedUrl(fingerprint) {
		const remaining = useChance(fingerprint);
		if (remaining > 0) {
			alert(`You violated the TOS! You have ${remaining} chance(s) left.`);
			location.reload();
			window.location.replace("/");
		} else {
			try {
				await fetch('/api/ban', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ fingerprint, uuid: fingerprint, ip: null })
				});
				window.location.href = "/blocked";
				return true; // banned
			} catch (err) {
				console.error('Failed to ban user:', err);
				alert('You triggered a blocked word.');
				return true;
			}
		}
	}

	// === Check URL ===
	function isUrl(val = "") {
		return /^http(s?):\/\//.test(val) || (val.includes(".") && val.substr(0, 1) !== " ");
	}

	// === Decoders (declared once globally) ===
	function uvDecodeUrl(url) {
		return __uv$config.decodeUrl(url);
	}
	function sjDecodeUrl(url) {
		return decodeURIComponent(url);
	}
	window.uvDecodeUrl = uvDecodeUrl;
	window.sjDecodeUrl = sjDecodeUrl;

	// === Encode functions (DO NOT TOUCH) ===
	function logHistory(url) {
		if (localStorage.getItem("proxy") === "uv") {
			const decodedUrl = __uv$config.decodeUrl(url);
			safeStore("history", decodedUrl);
			return decodedUrl;
		} else if (localStorage.getItem("proxy") === "sj") {
			const decodedUrl = decodeURIComponent(url);
			safeStore("history", decodedUrl);
			return decodedUrl;
		} else if (localStorage.getItem("proxy") === "ec") {
			const decodedUrl = __eclipse$config.codec.encode(url);
			safeStore("history", decodedUrl);
			return decodedUrl;
		}
		safeStore("history", url);
		return url;
	}

	async function rhEncode(url) {
		const encodedUrl = await RammerheadEncode(url);
		logHistory(url);
		safeStore("url", encodedUrl);
		window.location.href = "/" + encodedUrl;
	}

	async function uvEncode(url) {
		const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
		logHistory(encodedUrl);
		safeStore("url", encodedUrl);
		sessionStorage.setItem("Url", encodedUrl);
		window.location.href = encodedUrl;
	}

	async function ecEncode(url) {
		const encodedUrl = __eclipse$config.prefix + __eclipse$config.codec.encode(url);
		logHistory(url);
		safeStore("url", encodedUrl);
		sessionStorage.setItem("Url", encodedUrl);
		window.location.href = encodedUrl;
	}

	async function sjEncode(url) {
		const encodedUrl = "/scram/service/" + encodeURIComponent(url);
		logHistory(url);
		safeStore("url", encodedUrl);
		window.location.href = encodedUrl;
	}

	// === Decode button listeners ===
	const uvDecodeButton = document.getElementById("uvDecodeButton");
	const sjDecodeButton = document.getElementById("sjDecodeButton");
	const uvDecode = document.getElementById("uvDecode");
	const sjDecode = document.getElementById("sjDecode");

	if (uvDecodeButton && uvDecode) {
		uvDecodeButton.addEventListener("click", () => {
			if (!uvDecode.value.trim()) return alert("Please enter a URL to decode.");
			uvDecode.value = uvDecodeUrl(uvDecode.value);
		});
	}

	if (sjDecodeButton && sjDecode) {
		sjDecodeButton.addEventListener("click", () => {
			if (!sjDecode.value.trim()) return alert("Please enter a URL to decode.");
			sjDecode.value = sjDecodeUrl(sjDecode.value);
		});
	}

	// === Main form handler ===
	if (form && input) {
		form.addEventListener("submit", async (event) => {
			event.preventDefault();

			let blocked = await getBlockedTerms();
			let url = input.value.toLowerCase().trim();
			const fingerprint = await getFingerprint();

			// --- Check blocked terms ---
			if (blocked.some(term => url.includes(term))) {
				if (await handleBlockedUrl(fingerprint)) return;
			}

			// --- Search engine fallback ---
			if (!isUrl(url)) {
				const engine = localStorage.getItem("searchEngine") || "duckduckgo";
				switch (engine) {
					case "google":
						url = "https://www.google.com/search?q=" + url;
						break;
					case "duckduckgo":
						url = "https://duckduckgo.com/?t=h_&q=" + url;
						break;
					case "bing":
						url = "https://www.bing.com/search?q=" + url;
						break;
					case "yahoo":
						url = "https://search.yahoo.com/search?p=" + url;
						break;
					case "ecosia":
						url = "https://www.ecosia.org/search?q=" + url;
						break;
					case "irs":
						url = "https://www.irs.gov/site-index-search?search=" + url;
						break;
					default:
						url = "https://www.google.com/search?q=" + url;
						break;
				}
			} else if (!url.startsWith("https://") && !url.startsWith("http://")) {
				url = `https://${url}`;
			}

			// --- Pass to your existing encoding logic ---
			const proxy = localStorage.getItem("proxy") || "uv";
			switch (proxy) {
				case "uv":
					await uvEncode(url);
					break;
				case "sj":
					await sjEncode(url);
					break;
				case "ec":
					await ecEncode(url);
					break;
				case "rh":
					await rhEncode(url);
					break;
			}
		});
	}

	// === Load last history placeholder ===
	const lastDecodedUrl = localStorage.getItem("history");
	if (lastDecodedUrl) {
		input.placeholder = lastDecodedUrl;
	}

	// === Lazy init background tasks ===
	window.addEventListener("load", () => {
		initBareMux();
		initServiceWorker();
	});
});
