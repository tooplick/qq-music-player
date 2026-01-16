/**
 * Cover Image Utility
 * Fetches cover images with album_mid and vs value fallback
 */

const DEFAULT_COVER = 'https://y.gtimg.cn/music/photo_new/T002R800x800M000003y8dsH2wBHlo_1.jpg';

/**
 * Generate cover URL by album mid
 */
function getCoverUrlByAlbumMid(mid, size = 300) {
    if (!mid) return null;
    return `https://y.gtimg.cn/music/photo_new/T002R${size}x${size}M000${mid}.jpg`;
}

/**
 * Generate cover URL by vs value
 */
function getCoverUrlByVs(vs, size = 300) {
    if (!vs) return null;
    return `https://y.qq.com/music/photo_new/T062R${size}x${size}M000${vs}.jpg`;
}

/**
 * Check if cover URL is valid by fetching it
 */
async function checkCoverValid(url) {
    if (!url) return false;
    try {
        const resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) {
            const contentLength = resp.headers.get('content-length');
            // Check if image is larger than 1KB (valid image)
            return contentLength && parseInt(contentLength) > 1024;
        }
    } catch (e) {
        console.warn('Cover check failed:', url, e);
    }
    return false;
}

/**
 * Get valid cover URL with fallback chain
 * @param {Object} song - Song data object
 * @param {number} size - Cover size (150, 300, 500, 800)
 * @returns {Promise<string>} Valid cover URL or default cover
 */
export async function getValidCoverUrl(song, size = 300) {
    // Validate size
    const validSizes = [150, 300, 500, 800];
    if (!validSizes.includes(size)) {
        size = 300;
    }

    // 1. Try album_mid first
    const albumMid = song?.album_mid || song?.album?.mid;
    if (albumMid) {
        const url = getCoverUrlByAlbumMid(albumMid, size);
        if (await checkCoverValid(url)) {
            return url;
        }
    }

    // 2. Try vs values
    const vsValues = song?.vs || [];
    if (Array.isArray(vsValues)) {
        // Collect all candidate vs values
        const candidates = [];

        // Single vs values (priority 1)
        for (const vs of vsValues) {
            if (vs && typeof vs === 'string' && vs.length >= 3 && !vs.includes(',')) {
                candidates.push({ value: vs, priority: 1 });
            }
        }

        // Comma-separated vs values (priority 2)
        for (const vs of vsValues) {
            if (vs && typeof vs === 'string' && vs.includes(',')) {
                const parts = vs.split(',').map(p => p.trim()).filter(p => p.length >= 3);
                for (const part of parts) {
                    candidates.push({ value: part, priority: 2 });
                }
            }
        }

        // Sort by priority
        candidates.sort((a, b) => a.priority - b.priority);

        // Try each candidate
        for (const candidate of candidates) {
            const url = getCoverUrlByVs(candidate.value, size);
            if (await checkCoverValid(url)) {
                return url;
            }
        }
    }

    // 3. Return default cover
    return DEFAULT_COVER.replace('R800x800', `R${size}x${size}`);
}

/**
 * Synchronous cover URL getter (no validation)
 * Use this for immediate display, then validate async
 */
export function getCoverUrlSync(song, size = 300) {
    const albumMid = song?.album_mid || song?.album?.mid;
    if (albumMid) {
        return getCoverUrlByAlbumMid(albumMid, size);
    }
    return DEFAULT_COVER.replace('R800x800', `R${size}x${size}`);
}

export { DEFAULT_COVER };
