document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("form");
	const input = document.getElementById("input");
	const input2 = document.getElementById("input2");

	async function init() {
		try {
			const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

			let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";

			if (await connection.getTransport() !== "/epoxy/index.mjs") {
				await connection.setTransport("/epoxy/index.mjs", [{
					wisp: wispUrl
				}]);
				console.log("Using websocket transport " + "wisp url is: " + wispUrl);
			}
			const scramjet = new ScramjetController({
				prefix: "/scram/service/",
				files: {
					wasm: "/scram/scramjet.wasm.js",
					worker: "/scram/scramjet.worker.js",
					client: "/scram/scramjet.client.js",
					shared: "/scram/scramjet.shared.js",
					sync: "/scram/scramjet.sync.js"
				},
			});
			window.sj = scramjet;
			scramjet.init("/sw.js");
		} catch (error) {
			console.error("Error setting up BareMux transport:", error);
		}

		if (!localStorage.getItem("proxy")) {
			localStorage.setItem("proxy", "uv");
		}

		try {
			await navigator.serviceWorker.register("/sw.js");
			console.log("Registering service worker...");
		} catch (err) {
			throw new Error(err);
		}
	}

	init();

	if (form && input) {
		form.addEventListener("submit", async (event) => {
			event.preventDefault();

			function isUrl(val = "") {
				if (/^http(s?):\/\//.test(val) || (val.includes(".") && val.substr(0, 1) !== " ")) {
					return true;
				}
				return false;
			}

			if (!localStorage.getItem("proxy")) {
				localStorage.setItem("proxy", "uv");
			}

			var url = input.value;

			if (!isUrl(url)) {
				const engine = localStorage.getItem("search-engine") || "duckduckgo";

				if (engine === "google") {
					url = "https://www.google.com/search?q=" + url;
				} else if (engine === "duckduckgo") {
					url = "https://duckduckgo.com/?t=h_&q=" + url;
				} else if (engine === "bing") {
					url = "https://www.bing.com/search?q=" + url;
				} else if (engine === "yahoo") {
					url = "https://search.yahoo.com/search?p=" + url;
				} else if (engine === "ecosia") {
					url = "https://www.ecosia.org/search?q=" + url;
				} else if (engine === "irs") {
					url = "https://www.irs.gov/site-index-search?search=" + url;
				} else {
					url = "https://www.google.com/search?q=" + url;
				}
			} else if (!(url.startsWith("https://") || url.startsWith("http://"))) {
				url = `https://${url}`;
			}

			if (localStorage.getItem("proxy") == "uv") {
				uvEncode(url);
			} else if (localStorage.getItem("proxy") == "sj") {
				sjEncode(url);
			} else if (localStorage.getItem("proxy") == "ec") {
				ecEncode(url)
			} else if (localStorage.getItem("proxy") == "rh") {
				rhEncode(url);
			}

			function logHistory(decodedUrl) {
				localStorage.setItem("history", decodedUrl);
			}

			async function rhEncode(url) {
				const encodedUrl = await RammerheadEncode(url);
				logHistory(url);
				localStorage.setItem("url", encodedUrl);
				window.location.href = "/" + encodedUrl;
			}
			

			async function uvEncode(url) {
				const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
				logHistory(url);
				localStorage.setItem("url", encodedUrl);
				sessionStorage.setItem("Url", encodedUrl);
				window.location.href = "/test";
			}

			async function ecEncode(url) {
				const encodedUrl = self.__eclipse$config.prefix + self.__eclipse$config.codec.encode(url);
				logHistory(url);
				localStorage.setItem("url", encodedUrl);
				sessionStorage.setItem("Url", encodedUrl);
				window.location.href = "/test";
			}

			async function sjEncode(url) {
				const encodedUrl = "/scram/service/" + encodeURIComponent(url);
				logHistory(url);
				localStorage.setItem("url", encodedUrl);
				window.location.href = "/test";
			}
		});
	}

	function updateInputPlaceholder(decodedUrl) {
		input.placeholder = decodedUrl;
	}

	const lastDecodedUrl = localStorage.getItem("history");
	if (lastDecodedUrl) {
		updateInputPlaceholder(lastDecodedUrl);
	}
});