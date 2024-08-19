const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

const mp3FilePath = path.join('assets', 'win.mp3');

async function fetchMp3Buffer() {
    return new Promise((resolve, reject) => {
        fs.readFile(mp3FilePath, (err, data) => {
            if (err) {
                reject(new Error('Failed to read MP3 file: ' + err.message));
            } else {
                resolve(Buffer.from(data));
            }
        });
    });
}

async function decryptWithMp3Key(encryptedData) {
    const mp3Buffer = await fetchMp3Buffer();
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const decryptedBuffer = encryptedBuffer.map((byte, index) => byte ^ mp3Buffer[index % mp3Buffer.length]);
    return JSON.parse(decryptedBuffer.toString('utf8'));
}

module.exports = { decryptWithMp3Key };