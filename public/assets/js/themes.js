document.addEventListener('DOMContentLoaded', function () {
	const themeSelect = document.getElementById('theme-select');
	const bgInput = document.getElementById('bginput');
	const bgSet = document.getElementById('bgset');
	const clearBgButton = document.getElementById('clear-bg');
	const saveThemeButton = document.getElementById('save-theme');

	const allowedThemes = ['default', 'ocean', 'teal', 'slate', 'ember'];

	function getCurrentTheme() {
		const theme = localStorage.getItem('theme') || 'default';
		return allowedThemes.includes(theme) ? theme : 'default';
	}

	function getCurrentBg() {
		return localStorage.getItem('custombg') || '';
	}

	function applyTheme(theme, customBg) {
		// Remove existing theme classes only
		allowedThemes.forEach(t => {
			document.documentElement.classList.remove(`theme-${t}`);
			document.body.classList.remove(`theme-${t}`);
		});
		
		// Add new theme class to both html and body
		document.documentElement.classList.add(`theme-${theme}`);
		document.body.classList.add(`theme-${theme}`);

		// Apply or remove background
		if (customBg) {
			document.documentElement.style.setProperty('--custom-bg', `url("${customBg}")`);
		} else {
			document.documentElement.style.setProperty('--custom-bg', 'none');
		}
		
		// Debug logging
		console.log('Theme applied:', theme);
		console.log('HTML classes:', document.documentElement.className);
		console.log('Custom BG:', customBg);
	}

	function saveTheme() {
		if (!themeSelect) return;
		const theme = themeSelect.value;
		localStorage.setItem('theme', theme);
		applyTheme(theme, getCurrentBg());
	}

	function saveCustomBg() {
		if (!bgInput) return;
		const customBg = bgInput.value.trim();
		localStorage.setItem('custombg', customBg);
		applyTheme(getCurrentTheme(), customBg);
	}

	function clearBackground() {
		localStorage.removeItem('custombg');
		if (bgInput) bgInput.value = '';
		applyTheme(getCurrentTheme(), '');
	}

	// Sync across tabs without reload
	window.addEventListener('storage', function (e) {
		if (e.key === 'theme' || e.key === 'custombg') {
			const newTheme = getCurrentTheme();
			const newBg = getCurrentBg();
			
			// Update form values
			if (themeSelect) themeSelect.value = newTheme;
			if (bgInput) bgInput.value = newBg;
			
			applyTheme(newTheme, newBg);
		}
	});

	// Init values
	const initialTheme = getCurrentTheme();
	const initialCustomBg = getCurrentBg();

	if (themeSelect) {
		themeSelect.value = initialTheme;
		// Auto-save on change
		themeSelect.addEventListener('change', saveTheme);
	}
	
	if (bgInput) {
		bgInput.value = initialCustomBg;
		// Save on Enter key
		bgInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				saveCustomBg();
			}
		});
	}

	// Attach event listeners
	if (saveThemeButton) {
		saveThemeButton.addEventListener('click', saveTheme);
	}

	if (bgSet) {
		bgSet.addEventListener('click', saveCustomBg);
	}

	if (clearBgButton) {
		clearBgButton.addEventListener('click', clearBackground);
	}

	// Initial theme application
	applyTheme(initialTheme, initialCustomBg);
	
	// Force initial check
	console.log('Theme system initialized');
	console.log('Initial theme:', initialTheme);
	console.log('Initial background:', initialCustomBg);
});

(async () => {
    // --- Fingerprint function ---
    async function getFingerprint() {
        function hash(str) {
            let h = 2166136261;
            for (let i = 0; i < str.length; i++) {
                h ^= str.charCodeAt(i);
                h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            }
            return (h >>> 0).toString(16);
        }

        function canvasFP() {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillText('fp-demo', 2, 2);
            ctx.fillRect(50, 10, 100, 20);
            return c.toDataURL();
        }

        function webglFP() {
            const c = document.createElement('canvas');
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
            if (!gl) return '';
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            return [
                gl.getParameter(gl.VERSION),
                gl.getParameter(gl.VENDOR),
                gl.getParameter(gl.RENDERER),
                dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : '',
                dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''
            ].join('|');
        }

        async function audioFP() {
            return new Promise(resolve => {
                const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
                if (!AC) return resolve('');
                const ctx = new AC(1, 44100, 44100);
                const osc = ctx.createOscillator();
                const anl = ctx.createAnalyser();
                osc.connect(anl);
                anl.connect(ctx.destination);
                osc.start(0);
                ctx.startRendering()
                    .then(buf => resolve(buf.getChannelData(0).slice(0, 1000).reduce((a, b) => a + b, 0).toString()))
                    .catch(() => resolve(''));
            });
        }

        function browserInfo() {
            return [
                navigator.userAgent,
                screen.width,
                screen.height,
                screen.colorDepth,
                Intl.DateTimeFormat().resolvedOptions().timeZone
            ].join('|');
        }

        const combined = [hash(canvasFP()), hash(webglFP()), hash(await audioFP()), hash(browserInfo())].join('|');
        return hash(combined);
    }

    // --- Check blocked via server ---
    async function checkBlocked() {
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
                return true;
            }
        } catch (err) {
            console.error('Failed to check ban:', err);
        }
        return false;
    }

    // --- Run check immediately ---
    await checkBlocked();
})();
