/**
 * Cloudflare Pages Function for General Proxy
 * Forwards requests to QQ Music API
 */

export async function onRequest(context) {
    const { request } = context;

    // Handle options
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Proxy-Cookie",
            },
        });
    }

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const url = new URL(request.url);
        const sign = url.searchParams.get("sign");
        let targetUrl = "https://u.y.qq.com/cgi-bin/musics.fcg";

        // Append sign if present
        if (sign) {
            targetUrl += `?sign=${sign}`;
        }

        // Read request body
        const body = await request.text();

        // Prepare headers
        const headers = {
            "Content-Type": "application/json",
            "Referer": "https://y.qq.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://y.qq.com"
        };

        // Handle Cookie
        const proxyCookie = request.headers.get("X-Proxy-Cookie");
        if (proxyCookie) {
            headers["Cookie"] = proxyCookie;
        }

        // Forward request
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: headers,
            body: body
        });

        const responseBody = await response.text();

        // Return response with CORS
        return new Response(responseBody, {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Proxy-Cookie",
            },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
}
