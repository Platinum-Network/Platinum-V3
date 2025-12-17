import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { server as blockwisp, logging } from "@mercuryworkshop/wisp-js/server";
import { server as wisp} from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

// ---------------------
// Paths
// ---------------------
const publicPath = fileURLToPath(new URL("public/", import.meta.url));


// ---------------------
// Wisp Configuration
// ---------------------
logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  hostname_blacklist: [
    /pornhub\.com/i,
    /xvideos\.com/i,
    /redtube\.com/i,
    /youporn\.com/i,
    /xhamster\.com/i,
    /xnxx\.com/i,
    /spankbang\.com/i,
    /tube8\.com/i,
    /tnaflix\.com/i,
    /porndig\.com/i,
    /efukt\.com/i,
    /empflix\.com/i,
    /javhub\.com/i,
    /faproulette\.com/i,
    /sex\.com/i,
    /cam4\.com/i,
    /chaturbate\.com/i,
    /livejasmin\.com/i,
    /onlyfans\.com/i,
    /fansly\.com/i,
    /manyvids\.com/i,
    /clips4sale\.com/i
  ],
  dns_servers: ["1.1.1.1", "8.8.8.8"], // AdGuard DNS
});

logging.set_level(logging.NONE);
Object.assign(blockwisp.options, {
  allow_udp_streams: false,
  hostname_blacklist: [
    /pornhub\.com/i,
    /xvideos\.com/i,
    /redtube\.com/i,
    /youporn\.com/i,
    /xhamster\.com/i,
    /xnxx\.com/i,
    /spankbang\.com/i,
    /tube8\.com/i,
    /tnaflix\.com/i,
    /porndig\.com/i,
    /efukt\.com/i,
    /empflix\.com/i,
    /javhub\.com/i,
    /faproulette\.com/i,
    /sex\.com/i,
    /cam4\.com/i,
    /chaturbate\.com/i,
    /livejasmin\.com/i,
    /onlyfans\.com/i,
    /fansly\.com/i,
    /manyvids\.com/i,
    /clips4sale\.com/i
  ],
  dns_servers: ["94.140.14.14", "94.140.15.15"], // AdGuard DNS
});


// ---------------------
// Fastify setup
// ---------------------
const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
                else if (req.url.startsWith("/blockwisp/")) blockwisp.routeRequest(req, socket, head);
				else socket.end();
			});
	},
});

// ---------------------
// Static files
// ---------------------
fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});

fastify.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: epoxyPath,
	prefix: "/epoxy/",
	decorateReply: false,
});

fastify.get('/filters/:provider/check/:url', async (request, reply) => {
  const { provider, url } = request.params;

  if (!url) {
    return reply.status(400).send({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch from the real API
    const response = await fetch(
      `http://check.platinumunblocker.com/filters/${provider}/check/${encodeURIComponent(url)}`
    );
    const data = await response.json();
    return data;
  } catch (err) {
    reply.status(500).send({ error: 'Failed to fetch data', details: err.message });
  }
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

// ---------------------
// HTML page routes
// ---------------------
const pages = [
  { path: "/", file: "rindex.html" },
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
  { path: "/watch", file: "watch.html" },
];

pages.forEach((page) => {
  fastify.get(page.path, (req, reply) => reply.sendFile(page.file));
});

// 404 fallback
fastify.setNotFoundHandler((req, reply) => reply.sendFile("404.html"));

// ---------------------
// In-memory ban store
// ---------------------
const bans = {};
const BAN_DURATION_MS = 45 * 60 * 1000; // 45 min

// ---------------------
// API endpoints
// ---------------------
fastify.post("/api/check-ban", async (req, reply) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return reply.code(400).send({ error: "No fingerprint" });
  const ban = bans[fingerprint];
  return reply.send({ banned: ban && new Date() < new Date(ban.bannedUntil) });
});

fastify.post("/api/ban-time", async (req, reply) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return reply.code(400).send({ error: "No fingerprint" });
  const ban = bans[fingerprint];
  if (!ban) return reply.send({ remainingMinutes: 0 });
  const remaining = Math.ceil((new Date(ban.bannedUntil) - new Date()) / 60000);
  return reply.send({ remainingMinutes: remaining > 0 ? remaining : 0 });
});

fastify.post("/api/ban", async (req, reply) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return reply.code(400).send({ error: "No fingerprint" });
  bans[fingerprint] = { bannedUntil: new Date(Date.now() + BAN_DURATION_MS) };
  return reply.send({ success: true, bannedUntil: bans[fingerprint].bannedUntil });
});

fastify.post("/api/unban", async (req, reply) => {
  const { fingerprint, password } = req.body;
  if (!fingerprint || !password) return reply.status(400).send({ success: false, error: "Missing parameters" });
  if (password !== "Car0613!") return reply.status(401).send({ success: false, error: "Incorrect password" });
  if (bans[fingerprint]) delete bans[fingerprint];
  return reply.send({ success: true });
});

// DuckDuckGo suggestions
fastify.get("/results/:query", async (req, reply) => {
  try {
    const response = await fetch(`https://api.duckduckgo.com/ac?q=${encodeURIComponent(req.params.query)}&format=json`);
    const data = await response.json();
    reply.send(data);
  } catch {
    reply.status(500).send({ error: "Failed to fetch results" });
  }
});

// ---------------------
// Server startup
// ---------------------
fastify.server.on("listening", () => {
	const address = fastify.server.address();

	// by default we are listening on 0.0.0.0 (every interface)
	// we just need to list a few
	console.log("Listening on:");
	console.log(`\thttp://localhost:${address.port}`);
	console.log(`\thttp://${hostname()}:${address.port}`);
	console.log(
		`\thttp://${
			address.family === "IPv6" ? `[${address.address}]` : address.address
		}:${address.port}`
	);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	fastify.close();
	process.exit(0);
}

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

fastify.listen({
	port: port,
	host: "0.0.0.0",
});