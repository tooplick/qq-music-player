/**
 * QQ Music Credential Management
 */

const CREDENTIAL_KEY = 'qqmusic_credential';

/**
 * Default credential from user
 */
const DEFAULT_CREDENTIAL = {
    openid: "42AE3A348004B73125D733A21B11EE23",
    refresh_token: "",
    access_token: "6A303FEB150395D49BF82D8221755E0D",
    expired_at: 1773141595,
    musicid: 896389745,
    musickey: "Q_H_L_63k3NfxfafaMQiMKUr9MXLMR_PjPhQkXw-1f9DX_DQ14buWft3H1ysjiMIoAMtiyH0Aphv2xhcCnS4iDQsc5LaDUglCahhGcl5YRihZiPtwOgWr3jqg5ungn_LRVWEa81mUfsuaFyHTQDa588s_DmTPSf",
    unionid: "",
    str_musicid: "896389745",
    refresh_key: "64aN2V8uMT35hTAbHsH2JLfpcpDONgn-tHswQRXSqqOOwsQfc-t1A8yy64Cq8rFzdpXDDit_yM6xuukXj1KeTQKYy4aiXsSMS1Ys580eN9M0xk-NABDVhL4D0v1YW-X_-OzyNYic_tyBJkNeIRsPIhT8Bp",
    encrypt_uin: "NeEsoicq7ivk",
    login_type: 2,
    extra_fields: {
        musickeyCreateTime: 1768039958,
        keyExpiresIn: 259200
    }
};

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
     * Save credential to localStorage
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
     * Load credential from localStorage or use default
     */
    static load() {
        try {
            const saved = localStorage.getItem(CREDENTIAL_KEY);
            if (saved) {
                return new Credential(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load credential from storage:', e);
        }
        return new Credential(DEFAULT_CREDENTIAL);
    }

    /**
     * Update credential with new data (e.g., after refresh)
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

/**
 * Get or create global credential
 */
export function getCredential() {
    if (!globalCredential) {
        globalCredential = Credential.load();
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

export default { Credential, getCredential, updateCredential };
