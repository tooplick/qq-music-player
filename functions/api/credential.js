/**
 * Cloudflare Pages Function - 凭证读取 API
 * GET /api/credential - 返回当前存储的凭证
 * 首次访问时自动从环境变量 INITIAL_CREDENTIAL 初始化
 */

/**
 * 解析初始凭证（从环境变量）
 */
function parseInitialCredential(envValue) {
    if (!envValue) return null;

    try {
        const data = JSON.parse(envValue);

        // 解析 extra_fields
        let extraFields = {};
        if (typeof data.extra_fields === "string") {
            try {
                extraFields = JSON.parse(data.extra_fields.replace(/'/g, '"'));
            } catch (e) {
                console.warn("解析 extra_fields 失败:", e);
            }
        } else if (typeof data.extra_fields === "object") {
            extraFields = data.extra_fields;
        }

        return {
            openid: data.openid || "",
            refresh_token: data.refresh_token || "",
            access_token: data.access_token || "",
            expired_at: parseInt(data.expired_at) || 0,
            musicid: String(data.musicid || ""),
            musickey: data.musickey || "",
            unionid: data.unionid || "",
            str_musicid: data.str_musicid || "",
            refresh_key: data.refresh_key || "",
            encrypt_uin: data.encrypt_uin || "",
            login_type: parseInt(data.login_type) || 2,
            musickey_createtime: extraFields.musickeyCreateTime || 0,
            key_expires_in: extraFields.keyExpiresIn || 259200,
        };
    } catch (e) {
        console.error("解析 INITIAL_CREDENTIAL 失败:", e);
        return null;
    }
}

/**
 * 确保表存在并初始化凭证
 */
async function ensureCredential(db, initialCredential) {
    // 创建表
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY DEFAULT 1,
            openid TEXT,
            refresh_token TEXT,
            access_token TEXT,
            expired_at INTEGER,
            musicid TEXT,
            musickey TEXT,
            unionid TEXT,
            str_musicid TEXT,
            refresh_key TEXT,
            encrypt_uin TEXT,
            login_type INTEGER DEFAULT 2,
            musickey_createtime INTEGER,
            key_expires_in INTEGER DEFAULT 259200,
            updated_at INTEGER,
            CHECK (id = 1)
        )
    `).run();

    // 检查是否有凭证
    const existing = await db.prepare("SELECT id FROM credentials WHERE id = 1").first();

    if (!existing && initialCredential) {
        // 从环境变量导入初始凭证
        const now = Math.floor(Date.now() / 1000);
        const c = initialCredential;

        await db.prepare(`
            INSERT INTO credentials (
                id, openid, refresh_token, access_token, expired_at,
                musicid, musickey, unionid, str_musicid, refresh_key,
                encrypt_uin, login_type, musickey_createtime, key_expires_in, updated_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            c.openid, c.refresh_token, c.access_token, c.expired_at,
            c.musicid, c.musickey, c.unionid, c.str_musicid, c.refresh_key,
            c.encrypt_uin, c.login_type, c.musickey_createtime, c.key_expires_in, now
        ).run();

        console.log("初始凭证已从环境变量导入");
    }
}

export async function onRequest(context) {
    const { request, env } = context;

    // CORS 预检
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }

    try {
        // 解析环境变量中的初始凭证
        const initialCredential = parseInitialCredential(env.INITIAL_CREDENTIAL);

        // 确保表和凭证存在
        await ensureCredential(env.DB, initialCredential);

        // 读取凭证
        const result = await env.DB.prepare(
            "SELECT * FROM credentials WHERE id = 1"
        ).first();

        if (!result) {
            return new Response(JSON.stringify({
                error: "No credential found. Please configure INITIAL_CREDENTIAL in wrangler.toml",
                credential: null
            }), {
                status: 404,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // 构建凭证对象
        const credential = {
            openid: result.openid || "",
            refresh_token: result.refresh_token || "",
            access_token: result.access_token || "",
            expired_at: result.expired_at || 0,
            musicid: result.musicid || "",
            musickey: result.musickey || "",
            unionid: result.unionid || "",
            str_musicid: result.str_musicid || "",
            refresh_key: result.refresh_key || "",
            encrypt_uin: result.encrypt_uin || "",
            login_type: result.login_type || 2,
            extra_fields: {
                musickeyCreateTime: result.musickey_createtime || 0,
                keyExpiresIn: result.key_expires_in || 259200,
            },
        };

        return new Response(JSON.stringify({ credential }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

    } catch (err) {
        console.error("读取凭证失败:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
}
