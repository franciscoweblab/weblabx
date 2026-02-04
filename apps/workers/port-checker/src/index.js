import { connect } from 'cloudflare:sockets';

const MAX_PORTS = 15;
const TIMEOUT = 2500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request) {

    const url = new URL(request.url);

    // ✅ Preflight (browser)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ✅ Route guard
    if (url.pathname !== "/port-check") {
      return new Response("Not Found", { status: 404 });
    }

    // ✅ Method guard
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    let data;

    try {
      data = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    let { host, ports } = data;

    if (!host || !Array.isArray(ports)) {
      return Response.json({
        error: "Invalid payload",
        expected: {
          host: "example.com",
          ports: [80, 443]
        }
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // ✅ Normalizar host
    host = normalizeHost(host);

    // ✅ Validar portas
    const validPorts = ports
      .filter(p => Number.isInteger(p) && p > 0 && p <= 65535)
      .slice(0, MAX_PORTS);

    if (!validPorts.length) {
      return Response.json({
        error: "No valid ports provided"
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // ✅ Scan paralelo
    const results = await Promise.all(
      validPorts.map(port => checkPort(host, port))
    );

    return new Response(JSON.stringify({
      host,
      results
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};


// ----------------------------
// Helpers
// ----------------------------

function normalizeHost(host) {
  return host
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

async function checkPort(host, port) {

  const start = Date.now();

  try {

    const socket = connect({
      hostname: host,
      port: port,
    });

    await Promise.race([
      socket.opened,
      timeoutPromise(TIMEOUT)
    ]);

    socket.close();

    return {
      port,
      status: "open",
      latency: Date.now() - start
    };

  } catch (err) {

    const latency = Date.now() - start;

    if (err.message?.includes("timeout")) {
      return {
        port,
        status: "filtered",
        latency
      };
    }

    return {
      port,
      status: "closed",
      latency
    };
  }
}

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
}
