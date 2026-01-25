/**
 * QQ Music SongList API
 */

import { apiRequest } from './request.js';

/**
 * Get song list detail by id (disstid)
 * @param {string|number} disstid - Playlist ID (e.g., 8623138138)
 * @returns {Promise<Object>} - Playlist detail with song list
 */
export async function getSongListDetail(disstid) {
    const params = {
        disstid: Number(disstid),
        dirid: 0,
        tag: 1,
        cls: 1
    };

    const data = await apiRequest(
        'music.srf.diss_info.DisstsServer',
        'CgiGetDiss',
        params
    );

    // Normalize result
    if (data && data.dirinfo && data.songlist) {
        return {
            info: data.dirinfo,
            songs: data.songlist
        };
    }

    throw new Error('Invalid playlist data');
}

export default { getSongListDetail };
