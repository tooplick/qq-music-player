/**
 * QQ Music API Request Module
 * Handles HTTP requests to QQ Music API
 */

import { sign } from './sign.js';
import { getCredential } from './credential.js';

// API Configuration
const API_CONFIG = {
    version: '13.2.5.8',
    versionCode: 13020508,
    endpoint: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
    encEndpoint: '/api', // Cloudflare Pages Functions
    enableSign: true
};

// Common request parameters
const COMMON_DEFAULTS = {
    ct: '11',
    tmeAppID: 'qqmusic',
    format: 'json',
    inCharset: 'utf-8',
    outCharset: 'utf-8',
    uid: '3931641530'
};

/**
 * Generate random GUID
 */
export function getGuid() {
    const chars = 'abcdef1234567890';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate random search ID
 * Uses BigInt to handle large numbers correctly (JavaScript Number has safe integer limit)
 */
export function getSearchId() {
    const e = BigInt(Math.floor(Math.random() * 20) + 1);
    const t = e * 18014398509481984n;
    const n = BigInt(Math.floor(Math.random() * 4194304)) * 4294967296n;
    const r = BigInt(Date.now() % (24 * 60 * 60 * 1000));
    return (t + n + r).toString();
}

/**
 * Build common parameters for request
 */
function buildCommonParams(credential, extra = {}) {
    const common = {
        cv: API_CONFIG.versionCode,
        v: API_CONFIG.versionCode,
        QIMEI36: "8888888888888888", // Fake QIMEI to match Python structure
        ...COMMON_DEFAULTS
    };

    if (credential && credential.hasMusicId() && credential.hasMusicKey()) {
        common.qq = String(credential.musicid);
        common.authst = credential.musickey;
        common.tmeLoginType = String(credential.login_type);
    }

    return { ...common, ...extra };
}

/**
 * Build API request data
 */
function buildRequestData(module, method, params, credential, extraCommon = {}) {
    const common = buildCommonParams(credential, extraCommon);
    const key = `${module}.${method}`;

    // Convert boolean values to integers (Python API expects this)
    const processedParams = {};
    for (const [k, v] of Object.entries(params)) {
        if (typeof v === 'boolean') {
            processedParams[k] = v ? 1 : 0;
        } else {
            processedParams[k] = v;
        }
    }

    return {
        comm: common,
        [key]: {
            module,
            method,
            param: processedParams
        }
    };
}

/**
 * Build cookies from credential
 */
function buildCookies(credential) {
    if (!credential || !credential.hasMusicId() || !credential.hasMusicKey()) {
        return '';
    }

    // Cookie format must match what Python httpx sends
    const cookies = [
        `uin=${credential.musicid}`,
        `qqmusic_key=${credential.musickey}`,
        `qm_keyst=${credential.musickey}`,
        `tmeLoginType=${credential.login_type}`
    ];

    return cookies.join('; ');
}

/**
 * Send API request
 * @param {string} module - API module name
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response data
 */
export async function apiRequest(module, method, params = {}, options = {}) {
    const credential = options.credential || getCredential();
    const extraCommon = options.common || {};

    const requestData = buildRequestData(module, method, params, credential, extraCommon);

    let url = API_CONFIG.endpoint;
    const headers = {
        'Content-Type': 'application/json',
    };

    // Add Cookies
    const cookieHeader = buildCookies(credential);
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader; // Current manual mapping
        // Also add to custom header safely just in case CORS strips 'Cookie' (browsers strict)
        // But since we proxy, the proxy should forward it if we send it.
        // Standard browsers forbid setting 'Cookie' header in JS fetch for security mostly,
        // unless credentials: 'include' is used, but that uses browser cookies.
        // Since we are using a proxy, we might need to pass it in a custom header that the proxy converts to Cookie.
        headers['X-Proxy-Cookie'] = cookieHeader;
    }

    const fetchOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
    };

    // Add signature if enabled
    if (API_CONFIG.enableSign) {
        const signature = await sign(requestData);
        // Support custom endpoint (e.g. /lyric_proxy)
        const path = options.endpoint || '';
        url = `${API_CONFIG.encEndpoint}${path}?sign=${signature}`;
    }

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        // console.log(`API Response [${module}.${method}]:`, data); 

        const key = `${module}.${method}`;
        const result = data[key] || {};

        // Check response code
        if (result.code !== 0 && result.code !== undefined) {
            console.error(`API Error [${module}.${method}]: code=${result.code}`, result);
            if (result.code === 1000) {
                throw new Error('Credential expired');
            }
            if (result.code === 2000) {
                throw new Error('Sign invalid');
            }
            throw new Error(`API error: ${result.code}`);
        }

        return result.data || result;
    } catch (error) {
        console.error(`API Request failed [${module}.${method}]:`, error);
        throw error;
    }
}

export default { apiRequest, getGuid, getSearchId };
