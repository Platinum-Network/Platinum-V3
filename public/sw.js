if (navigator.userAgent.includes('Firefox')) {
    Object.defineProperty(globalThis, 'crossOriginIsolated', {
        value: true,
        writable: false,
    });
}

importScripts('uv/uv.bundle.js');
importScripts('uv/uv.config.js');
importScripts('uv/uv.sw.js');
importScripts("ec/eclipse.codecs.js");
importScripts("ec/eclipse.config.js");
importScripts("ec/eclipse.rewrite.js");
importScripts("ec/eclipse.worker.js");
importScripts('/scram/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
const uv = new UVServiceWorker();
const eclipse = new EclipseServiceWorker();

let playgroundData;

self.addEventListener("message", ({ data }) => {
    if (data.type === "playgroundData") {
        playgroundData = data;
    }
});

async function handleRequest(event) {
    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }

    if (uv.route(event)) {
        return await uv.fetch(event);
    }

	if (eclipse.route(event)) {
		return await eclipse.fetch(event);
	}

	return await fetch(event.request);
}


self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});