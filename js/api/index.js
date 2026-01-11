/**
 * QQ Music API - Main Entry
 */

export { sign } from './sign.js';
export { Credential, getCredential, updateCredential } from './credential.js';
export { apiRequest, getGuid, getSearchId } from './request.js';
export { searchByType, quickSearch, getHotKeys } from './search.js';
export { getSongUrls, getSongUrlWithFallback, getSongDetail, SongFileType } from './song.js';
export { getLyric } from './lyric.js';
export { checkExpired, refreshCredential, getUserInfo } from './login.js';
