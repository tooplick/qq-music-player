/**
 * TripleDES decryption using Web Worker
 * Offloads CPU intensive tasks to prevent UI stuttering
 */

let worker = null;

function getWorker() {
    if (!worker) {
        worker = new Worker('js/utils/decrypt-worker.js');
    }
    return worker;
}

export function qrc_decrypt(encrypted_qrc_hex) {
    return new Promise((resolve, reject) => {
        if (!encrypted_qrc_hex) {
            resolve("");
            return;
        }

        const w = getWorker();

        // Setup one-time listener for simplicity (or use a correlation ID for better concurrency)
        // Since playSong is debounced, simple mostly works, but cleaner to handle concurrency.
        // For simple usage in this app:

        const handler = (e) => {
            w.removeEventListener('message', handler);
            resolve(e.data);
        };

        const errorHandler = (e) => {
            w.removeEventListener('error', errorHandler);
            w.removeEventListener('message', handler);
            console.error("Worker error:", e);
            resolve(""); // Graceful fail
        };

        w.addEventListener('message', handler);
        w.addEventListener('error', errorHandler);

        w.postMessage(encrypted_qrc_hex);
    });
}
