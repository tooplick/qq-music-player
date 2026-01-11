/**
 * QQ Music Search API
 */

import { apiRequest, getSearchId } from './request.js';

/**
 * Search songs by keyword
 * @param {string} keyword - Search keyword
 * @param {number} num - Number of results (default 20)
 * @param {number} page - Page number (default 1)
 * @returns {Promise<Array>} - Array of song results
 */
export async function searchByType(keyword, num = 20, page = 1) {
    const params = {
        searchid: getSearchId(),
        query: keyword,
        search_type: 0,
        num_per_page: num,
        page_num: page,
        highlight: 1,
        grp: 1
    };

    const result = await apiRequest(
        'music.search.SearchCgiService',
        'DoSearchForQQMusicMobile',
        params
    );

    // Extract song list from response - try multiple possible paths
    if (result.body?.item_song) {
        return result.body.item_song;
    }
    if (result.item_song) {
        return result.item_song;
    }
    if (result.data?.body?.item_song) {
        return result.data.body.item_song;
    }

    console.warn('No songs found in response:', result);
    return [];
}

/**
 * Quick search (autocomplete)
 * @param {string} keyword - Search keyword
 * @returns {Promise<Object>} - Search suggestions
 */
export async function quickSearch(keyword) {
    try {
        const response = await fetch(
            `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${encodeURIComponent(keyword)}`,
            {
                headers: {
                    'Referer': 'https://y.qq.com/'
                }
            }
        );
        const data = await response.json();
        return data.data || {};
    } catch (error) {
        console.error('Quick search failed:', error);
        return {};
    }
}

/**
 * Get hot search keywords
 * @returns {Promise<Array>} - Hot keywords
 */
export async function getHotKeys() {
    const params = {
        search_id: getSearchId()
    };

    const result = await apiRequest(
        'music.musicsearch.HotkeyService',
        'GetHotkeyForQQMusicMobile',
        params
    );

    return result.vec_hotkey || [];
}

export default { searchByType, quickSearch, getHotKeys };
