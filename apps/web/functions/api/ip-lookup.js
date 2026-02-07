export async function onRequest(context) {

    const { request, env } = context;

    const url = new URL(request.url);
    const ip = url.searchParams.get("ip");

    if (!ip) {
        return json({ error: "Missing IP parameter" }, 400);
    }

    try {

        const res = await fetch(
            `https://ipinfo.io/${ip}?token=${env.IPINFO_TOKEN}`
        );

        if (!res.ok) {
            return json({ error: "Lookup failed" }, 500);
        }

        const data = await res.json();

        return json({
            ip: data.ip,
            hostname: data.hostname || null,
            country: data.country || null,
            region: data.region || null,
            city: data.city || null,
            location: data.loc || null,
            org: data.org || null,
            postal: data.postal || null,
            timezone: data.timezone || null
        });

    } catch {

        return json({ error: "Server error" }, 500);

    }
}


function json(body, status = 200){
    return new Response(JSON.stringify(body), {
        status,
        headers:{
            "content-type":"application/json",
            "cache-control":"public, max-age=300"
        }
    });
}
