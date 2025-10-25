async function init() {
    try {
        const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (localStorage.getItem("transport") == "epoxy") {
            if (await connection.getTransport() !== "/epoxy/index.mjs") {
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                console.log("Using websocket transport. Wisp URL is: " + wispUrl);
            }
        }
        else {
            if (await connection.getTransport() !== "/libcurl/index.mjs") {
                await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
                console.log("Using websocket transport. Wisp URL is: " + wispUrl);
            }
        }

    } catch (err) {
        console.error("An error occurred while setting up baremux:", err);
    }
    document.getElementById("frame").src = localStorage.getItem("url");
}

init().then(() => {
});

var reload = document.getElementById("reload");
reload.addEventListener("click", function () {
    document.getElementById("frame").contentWindow.location.reload();
});

var fullscreen = document.getElementById("fullscreen");
fullscreen.addEventListener("click", function () {
	const elem = document.getElementById("frame");
	if (!elem) {
		console.error("Iframe not found");
		return;
	}

	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.mozRequestFullScreen) {
		/* Firefox */
		elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) {
		/* Chrome, Safari and Opera */
		elem.webkitRequestFullscreen();
	} else if (elem.msRequestFullscreen) {
		/* IE/Edge */
		elem.msRequestFullscreen();
	}
});

var devtools = document.getElementById("devtools");
devtools.addEventListener("click", function () {
	// Get the main iframe directly using its ID
	const iframe = document.getElementById("frame");
	if (!iframe) {
		console.error("Iframe not found");
		return;
	}

	const erudaWindow = iframe.contentWindow;
	if (!erudaWindow) {
		console.error("No content window found for iframe");
		return;
	}

	const erudaDocument = iframe.contentDocument;
	if (!erudaDocument) {
		console.error("No content document found for iframe");
		return;
	}

	// Wait for iframe to load before injecting Eruda
	if (erudaDocument.readyState !== 'complete') {
		console.error("Please wait for the page to load completely");
		return;
	}

	if (erudaWindow.eruda && erudaWindow.eruda._isInit) {
		// If Eruda is initialized, destroy it
		erudaWindow.eruda.destroy();
	} else {
		// If Eruda doesn't exist or isn't initialized, create and init it
		if (!erudaWindow.eruda) {
			const script = erudaDocument.createElement("script");
			script.src = "https://cdn.jsdelivr.net/npm/eruda";
			script.onload = () => {
				if (!erudaWindow.eruda) {
					console.error("Failed to load Eruda in iframe");
					return;
				}
				erudaWindow.eruda.init();
				erudaWindow.eruda.show();
			};
			erudaDocument.head.appendChild(script);
		} else {
			// If Eruda exists but isn't initialized, just init it
			erudaWindow.eruda.init();
			erudaWindow.eruda.show();
		}
	}
});

function togglepopup() {
	window.open(document.getElementById("frame").src);
}

// Export the functions if using modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		toggledevtools,
		reload,
		toggleFullscreen
	};
}

// Back
function goBack() {
    const iframe = document.querySelector("#frame");
    if (iframe) {
      const contentWindow = iframe.contentWindow;
      if (contentWindow) {
            contentWindow.history.back();
            iframe.src = iframe.src; // Refresh the iframe to reflect any changes
            Load();
        }
    } else {
      console.error("No iframe with id 'frame' found");
    }
}

function goBack() {
    const iframe = document.getElementById("frame");
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.history.back();
        } catch (err) {
            console.log("Cannot access cross-origin history.");
        }
    } else {
        console.error("Iframe not found");
    }
}

function goForward() {
    const iframe = document.getElementById("frame");
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.history.forward();
        } catch (err) {
            console.log("Cannot access cross-origin history.");
        }
    } else {
        console.error("Iframe not found");
    }
}

function refreshPage() {
    const iframe = document.getElementById("frame");
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.location.reload();
        } catch (err) {
            console.log("Cannot reload cross-origin iframe.");
        }
    } else {
        console.error("Iframe not found");
    }
}