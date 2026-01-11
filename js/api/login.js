/**
 * QQ Music Login/Credential API
 */

import { apiRequest } from './request.js';
import { getCredential, updateCredential } from './credential.js';

/**
 * Check if credential is expired (server-side check)
 * @param {Object} credential - Optional credential
 * @returns {Promise<boolean>} - True if expired
 */
export async function checkExpired(credential = null) {
    const cred = credential || getCredential();

    try {
        await apiRequest(
            'music.UserInfo.userInfoServer',
            'GetLoginUserInfo',
            {},
            { credential: cred }
        );
        return false;
    } catch (error) {
        if (error.message === 'Credential expired') {
            return true;
        }
        // Other errors, assume not expired
        console.warn('Check expired error:', error);
        return false;
    }
}

/**
 * Refresh credential cookies
 * @returns {Promise<boolean>} - True if refresh successful
 */
export async function refreshCredential() {
    const cred = getCredential();

    if (!cred.refresh_key) {
        console.warn('No refresh_key available');
        return false;
    }

    const params = {
        refresh_key: cred.refresh_key,
        refresh_token: cred.refresh_token,
        musickey: cred.musickey,
        musicid: cred.musicid
    };

    try {
        const result = await apiRequest(
            'music.login.LoginServer',
            'Login',
            params,
            {
                credential: cred,
                common: { tmeLoginType: String(cred.login_type) }
            }
        );

        // Update credential with new data
        if (result.musickey) {
            updateCredential({
                musickey: result.musickey,
                musicid: result.musicid || cred.musicid,
                refresh_key: result.refresh_key || cred.refresh_key,
                refresh_token: result.refresh_token || cred.refresh_token,
                extra_fields: {
                    ...cred.extra_fields,
                    musickeyCreateTime: Math.floor(Date.now() / 1000),
                    keyExpiresIn: result.keyExpiresIn || 259200
                }
            });
            console.log('Credential refreshed successfully');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Refresh credential failed:', error);
        return false;
    }
}

/**
 * Get current user info
 * @returns {Promise<Object>} - User info
 */
export async function getUserInfo() {
    return await apiRequest(
        'music.UserInfo.userInfoServer',
        'GetLoginUserInfo',
        {}
    );
}

export default { checkExpired, refreshCredential, getUserInfo };
