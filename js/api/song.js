/**
 * QQ Music Song API
 */

import { apiRequest, getGuid } from './request.js';
import { getCredential } from './credential.js';

/**
 * Song file types
 */
export const SongFileType = {
    FLAC: { code: 'F000', ext: '.flac', name: 'FLAC' },
    MP3_320: { code: 'M800', ext: '.mp3', name: '320kbps' },
    MP3_128: { code: 'M500', ext: '.mp3', name: '128kbps' },
    OGG_192: { code: 'O600', ext: '.ogg', name: 'OGG 192' },
    ACC_192: { code: 'C600', ext: '.m4a', name: 'AAC 192' },
    ACC_96: { code: 'C400', ext: '.m4a', name: 'AAC 96' }
};

/**
 * Get song play URLs
 * @param {Array<string>} mids - Array of song mids
 * @param {Object} fileType - File type from SongFileType
 * @param {Object} credential - Optional credential
 * @returns {Promise<Object>} - Map of mid to URL
 */
export async function getSongUrls(mids, fileType = SongFileType.MP3_128, credential = null) {
    const cred = credential || getCredential();
    const guid = getGuid();

    // Build filenames
    const filenames = mids.map(mid => `${fileType.code}${mid}${mid}${fileType.ext}`);

    const params = {
        filename: filenames,
        guid: guid,
        songmid: mids,
        songtype: mids.map(() => 0)
    };

    const result = await apiRequest(
        'music.vkey.GetVkey',
        'UrlGetVkey',
        params,
        {
            credential: cred,
            common: { ct: '19' }
        }
    );

    // Build URL map
    const urls = {};
    const domain = 'https://isure.stream.qqmusic.qq.com/';

    if (result.midurlinfo) {
        for (const info of result.midurlinfo) {
            const purl = info.purl || info.wifiurl || '';
            urls[info.songmid] = purl ? domain + purl : '';
        }
    }

    return urls;
}

/**
 * Get song URL with quality fallback
 * @param {string} mid - Song mid
 * @param {boolean} preferFlac - Prefer FLAC quality
 * @returns {Promise<Object>} - { url, quality }
 */
export async function getSongUrlWithFallback(mid, preferFlac = false) {
    const qualityOrder = preferFlac
        ? [SongFileType.FLAC, SongFileType.MP3_320, SongFileType.MP3_128]
        : [SongFileType.MP3_320, SongFileType.MP3_128];

    for (const fileType of qualityOrder) {
        try {
            const urls = await getSongUrls([mid], fileType);
            if (urls[mid]) {
                return { url: urls[mid], quality: fileType.name };
            }
        } catch (e) {
            console.warn(`Failed to get ${fileType.name} URL:`, e);
        }
    }

    return { url: '', quality: '' };
}

/**
 * Get song detail
 * @param {string|number} value - Song mid or id
 * @returns {Promise<Object>} - Song detail
 */
export async function getSongDetail(value) {
    const params = typeof value === 'number'
        ? { song_id: value }
        : { song_mid: value };

    return await apiRequest(
        'music.pf_song_detail_svr',
        'get_song_detail_yqq',
        params
    );
}

export default { getSongUrls, getSongUrlWithFallback, getSongDetail, SongFileType };
