/**
 * QQ Music API Sign Algorithm
 * Ported from Python qqmusic_api/utils/sign.py
 */

const PART_1_INDEXES = [21, 4, 9, 26, 16, 20, 27, 30];
const PART_2_INDEXES = [18, 11, 3, 2, 1, 7, 6, 25];
const SCRAMBLE_VALUES = [21, 4, 9, 26, 16, 20, 27, 30, 18, 11, 3, 2, 1, 7, 6, 25, 0, 0, 0, 0];

/**
 * Calculate SHA1 hash of text (Web Crypto API)
 * @param {string} text - Input text
 * @returns {Promise<string>} - Hex uppercase hash
 */
async function sha1(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Generate API request signature
 * @param {Object} requestData - Request data to sign
 * @returns {Promise<string>} - Signature string
 */
export async function sign(requestData) {
    const jsonStr = JSON.stringify(requestData);
    const hash = await sha1(jsonStr);

    // Part 1: Extract characters at specific indexes
    const part1Indexes = [23, 14, 6, 36, 16, 40, 7, 19].filter(x => x < 40);
    const part1 = part1Indexes.map(i => hash[i] || '').join('');

    // Part 2: Extract characters at specific indexes
    const part2Indexes = [16, 1, 32, 12, 19, 27, 8, 5];
    const part2 = part2Indexes.map(i => hash[i] || '').join('');

    // Part 3: XOR scramble and base64 encode
    const scrambleValues = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179];
    const part3Bytes = new Uint8Array(20);
    for (let i = 0; i < scrambleValues.length; i++) {
        const hexValue = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
        part3Bytes[i] = scrambleValues[i] ^ hexValue;
    }

    // Base64 encode and remove special characters
    let b64Part = btoa(String.fromCharCode(...part3Bytes));
    b64Part = b64Part.replace(/[\\\/+=]/g, '');

    return `zzc${part1}${b64Part}${part2}`.toLowerCase();
}

export default { sign };
