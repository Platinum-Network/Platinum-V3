import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { join } from "node:path";
import { hostname } from "node:os";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createServer } from "node:http";

const __dirname = process.cwd();
const publicPath = join(__dirname, "public");

// Create Fastify instance with COOP/COEP headers and WebSocket upgrade handling
const fastify = Fastify({
    logger: true,
    serverFactory: (handler) => {
        const server = createServer((req, res) => {
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "anonymous");
            handler(req, res);
        });

        // Handle WebSocket upgrades for Wisp
        server.on("upgrade", (req, socket, head) => {
            wisp.routeRequest(req, socket, head);
        });

        return server;
    }
});

// ---------------------
// Static file routes
// ---------------------

// Public files
await fastify.register(fastifyStatic, { root: publicPath, prefix: "/" });

// Transport libraries
await fastify.register(fastifyStatic, { root: epoxyPath, prefix: "/epoxy/", decorateReply: false });
await fastify.register(fastifyStatic, { 
    root: libcurlPath, 
    prefix: "/libcurl/", 
    decorateReply: false,
    setHeaders: (res, path) => {
        if (path.endsWith(".mjs")) res.setHeader("Content-Type", "application/javascript");
    }
});
await fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// ---------------------
// HTML page routes
// ---------------------
const pages = [
    { path: "/", file: "/math/index.html" },
    { path: "/@", file: "rindex.html" },
    { path: "/lessons", file: "games.html" },
    { path: "/tools", file: "apps.html" },
    { path: "/quiz", file: "tabs.html" },
    { path: "/settings", file: "settings.html" },
    { path: "/test", file: "browser.html" },
    { path: "/search", file: "search.html" },
    { path: "/helper", file: "ai.html" },
    { path: "/tool", file: "tools.html" },
    { path: "/blocked", file: "blocked.html" },
    { path: "/bug", file: "report.html" },
];

pages.forEach(page => {
    fastify.get(page.path, (req, reply) => reply.sendFile(page.file));
});

// 404 fallback
fastify.setNotFoundHandler((req, reply) => reply.sendFile("404.html"));

// ---------------------
// In-memory ban store
// ---------------------
const bans = {}; // { fingerprint: { bannedUntil: Date } }
const BAN_DURATION_MS = 45 * 60 * 1000; // 45 minutes

// ---------------------
// API endpoints
// ---------------------

// Check if a fingerprint is banned
fastify.post('/api/check-ban', async (request, reply) => {
    const { fingerprint } = request.body;
    if (!fingerprint) return reply.code(400).send({ error: 'No fingerprint provided' });

    const ban = bans[fingerprint];
    if (ban && new Date() < new Date(ban.bannedUntil)) {
        return reply.send({ banned: true });
    } else {
        return reply.send({ banned: false });
    }
});

// Get remaining ban time for a fingerprint
fastify.post('/api/ban-time', async (request, reply) => {
  const { fingerprint } = request.body;
  if (!fingerprint) return reply.code(400).send({ error: 'No fingerprint provided' });

  const ban = bans[fingerprint];
  if (!ban) return reply.send({ remainingMinutes: 0 });

  const now = new Date();
  const remainingMs = new Date(ban.bannedUntil) - now;
  const remainingMinutes = remainingMs > 0 ? Math.ceil(remainingMs / 60000) : 0;

  return reply.send({ remainingMinutes });
});


// In your existing Fastify server code
fastify.post('/api/unban', async (request, reply) => {
  const { fingerprint, password } = request.body;

  if (!fingerprint || !password) {
    return reply.status(400).send({ success: false, error: 'Missing parameters' });
  }

  if (password !== 'Car0613!') {
    return reply.status(401).send({ success: false, error: 'Incorrect password' });
  }

  // Remove user from banned list
  if (bans[fingerprint]) {
    delete bans[fingerprint];
  }

  return reply.send({ success: true });
});



// Ban a fingerprint
fastify.post('/api/ban', async (request, reply) => {
    const { fingerprint } = request.body;
    if (!fingerprint) return reply.code(400).send({ error: 'No fingerprint provided' });

    const now = new Date();
    bans[fingerprint] = { bannedUntil: new Date(now.getTime() + BAN_DURATION_MS) };

    return reply.send({ success: true, bannedUntil: bans[fingerprint].bannedUntil });
});

// ---------------------
// Graceful shutdown
// ---------------------
function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    fastify.close();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ---------------------
// Start server
// ---------------------
let port = parseInt(process.env.PORT || "8110");
if (isNaN(port)) port = 8110;

try {
    const address = await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on:`);
    console.log(`\thttp://localhost:${port}`);
    console.log(`\thttp://${hostname()}:${port}`);
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
