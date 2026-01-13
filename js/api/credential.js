/**
 * QQ Music Credential Management
 * 优先从后端 D1 数据库加载凭证，localStorage 作为缓存
 */

const CREDENTIAL_KEY = 'qqmusic_credential';
const CREDENTIAL_API = '/api/credential';

/**
 * Credential class for QQ Music API
 */
export class Credential {
    constructor(data = {}) {
        this.openid = data.openid || '';
        this.refresh_token = data.refresh_token || '';
        this.access_token = data.access_token || '';
        this.expired_at = parseInt(data.expired_at) || 0;
        this.musicid = parseInt(data.musicid) || 0;
        this.musickey = data.musickey || '';
        this.unionid = data.unionid || '';
        this.str_musicid = data.str_musicid || '';
        this.refresh_key = data.refresh_key || '';
        this.encrypt_uin = data.encrypt_uin || '';
        this.login_type = parseInt(data.login_type) || 2;
        this.extra_fields = data.extra_fields || {};
    }

    hasMusicId() {
        return !!this.musicid;
    }

    hasMusicKey() {
        return !!this.musickey;
    }

    isValid() {
        return this.hasMusicId() && this.hasMusicKey();
    }

    /**
     * Check if credential is expired based on local timestamp
     */
    isExpired() {
        if (this.extra_fields.musickeyCreateTime && this.extra_fields.keyExpiresIn) {
            const expiredTimestamp = this.extra_fields.musickeyCreateTime + this.extra_fields.keyExpiresIn;
            return expiredTimestamp <= Math.floor(Date.now() / 1000);
        }
        return false;
    }

    /**
     * Convert to JSON for storage
     */
    toJSON() {
        return {
            openid: this.openid,
            refresh_token: this.refresh_token,
            access_token: this.access_token,
            expired_at: this.expired_at,
            musicid: this.musicid,
            musickey: this.musickey,
            unionid: this.unionid,
            str_musicid: this.str_musicid,
            refresh_key: this.refresh_key,
            encrypt_uin: this.encrypt_uin,
            login_type: this.login_type,
            extra_fields: this.extra_fields
        };
    }

    /**
     * Save credential to localStorage (cache)
     */
    save() {
        try {
            localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(this.toJSON()));
            return true;
        } catch (e) {
            console.error('Failed to save credential:', e);
            return false;
        }
    }

    /**
     * Load credential from localStorage cache
     */
    static loadFromCache() {
        try {
            const saved = localStorage.getItem(CREDENTIAL_KEY);
            if (saved) {
                return new Credential(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load credential from cache:', e);
        }
        return null;
    }

    /**
     * Load credential from server API
     */
    static async loadFromServer() {
        try {
            const response = await fetch(CREDENTIAL_API);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (data.credential) {
                const cred = new Credential(data.credential);
                cred.save(); // 缓存到 localStorage
                return cred;
            }
        } catch (e) {
            console.warn('Failed to load credential from server:', e);
        }
        return null;
    }

    /**
     * Load credential: server first, then cache
     */
    static async load() {
        // 优先从服务器加载
        const serverCred = await Credential.loadFromServer();
        if (serverCred && serverCred.isValid()) {
            console.log('Credential loaded from server');
            return serverCred;
        }

        // 服务器失败时从缓存加载
        const cachedCred = Credential.loadFromCache();
        if (cachedCred && cachedCred.isValid()) {
            console.log('Credential loaded from cache');
            return cachedCred;
        }

        // 都失败返回空凭证
        console.warn('No valid credential found');
        return new Credential();
    }

    /**
     * Sync load for compatibility (uses cache only)
     */
    static loadSync() {
        const cached = Credential.loadFromCache();
        return cached || new Credential();
    }

    /**
     * Update credential with new data
     */
    update(data) {
        Object.assign(this, data);
        if (data.extra_fields) {
            this.extra_fields = { ...this.extra_fields, ...data.extra_fields };
        }
        this.save();
    }
}

// Global credential instance
let globalCredential = null;
let credentialPromise = null;

/**
 * Get or create global credential (async, fetches from server)
 */
export async function getCredentialAsync() {
    if (globalCredential && globalCredential.isValid()) {
        return globalCredential;
    }

    if (!credentialPromise) {
        credentialPromise = Credential.load().then(cred => {
            globalCredential = cred;
            credentialPromise = null;
            return cred;
        });
    }

    return credentialPromise;
}

/**
 * Get global credential (sync, uses cache)
 * For backward compatibility with existing code
 */
export function getCredential() {
    if (!globalCredential) {
        globalCredential = Credential.loadSync();
        // 后台异步刷新
        getCredentialAsync().catch(console.error);
    }
    return globalCredential;
}

/**
 * Update global credential
 */
export function updateCredential(data) {
    const cred = getCredential();
    cred.update(data);
    return cred;
}

export default { Credential, getCredential, getCredentialAsync, updateCredential };
