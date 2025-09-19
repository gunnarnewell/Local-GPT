"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256File = sha256File;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
async function sha256File(filePath) {
    return new Promise((resolve, reject) => {
        const hash = (0, crypto_1.createHash)('sha256');
        const stream = (0, fs_1.createReadStream)(filePath);
        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}
//# sourceMappingURL=sha256.js.map