/**
 * QQ Music Search API
 * 使用 api.ygking.top
 */

/**
 * Search songs by keyword
 * @param {string} keyword - Search keyword
 * @param {number} num - Number of results (default 60)
 * @param {number} page - Page number (default 1)
 * @returns {Promise<Array>} - Array of song results
 */
export async function searchByType(keyword, num = 60, page = 1) {
    const url = `https://api.ygking.top/api/search?keyword=${encodeURIComponent(keyword)}&type=song&num=${num}&page=${page}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 0 && data.data?.list) {
            return data.data.list;
        }

        console.warn('No songs found in response:', data);
        return [];
    } catch (error) {
        console.error('Search failed:', error);
        throw error;
    }
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

export default { searchByType, quickSearch };

