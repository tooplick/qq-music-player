/**
 * QQ Music Lyric API
 */

import { apiRequest } from './request.js';

/**
 * Decrypt QRC lyric data (simplified - handles base64/hex encoded lyrics)
 * @param {string} data - Encrypted lyric data
 * @returns {string} - Decrypted lyric text
 */
function decryptLyric(data) {
    if (!data) return '';

    // If it's already plain text LRC format, return as is
    if (data.startsWith('[')) {
        return data;
    }

    // Try robust base64 decode
    try {
        // Remove any whitespace and convert to standard base64
        const cleanData = data.replace(/\s/g, '');
        // Decode using TextDecoder to handle UTF-8 strictly
        const binaryString = atob(cleanData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = new TextDecoder().decode(bytes);

        if (decoded.includes('[00:')) {
            return decoded;
        }
    } catch (e) {
        console.warn('Lyric decode failed:', e);
    }

    // For encrypted QRC, we return empty as full decryption requires 3DES
    // which is complex to implement in browser
    return '';
}

/**
 * Get song lyrics
 * @param {string|number} value - Song mid or id
 * @param {Object} options - Options { trans: boolean, roma: boolean }
 * @returns {Promise<Object>} - { lyric, trans, roma }
 */
export async function getLyric(value, options = {}) {
    const { trans = true, roma = false } = options;

    const params = {
        crypt: 1, // Enable crypt, proxy will handle decryption
        ct: 11,
        cv: 13020508,
        lrc_t: 0,
        qrc: 0,
        qrc_t: 0,
        roma: roma ? 1 : 0,
        roma_t: 0,
        trans: trans ? 1 : 0,
        trans_t: 0,
        type: 1
    };

    if (typeof value === 'number') {
        params.songId = value;
    } else {
        params.songMid = value;
    }

    // Use special proxy endpoint that handles decryption on server side
    const result = await apiRequest(
        'music.musichallSong.PlayLyricInfo',
        'GetPlayLyricInfo',
        params,
        { endpoint: '/lyric_proxy' } // Pass endpoint in options
    );

    // Proxy already decrypted it, so just return
    return {
        lyric: result.lyric || '',
        trans: result.trans || '',
        roma: result.roma || ''
    };
}

export default { getLyric };
