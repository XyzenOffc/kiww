const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = path.join(__dirname, '../src', + new Date + '.' + ext)
      let out = tmp + '.' + ext2
      await fs.promises.writeFile(tmp, buffer)
      spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await fs.promises.unlink(tmp)
            if (code !== 0) return reject(code)
            resolve(await fs.promises.readFile(out))
            await fs.promises.unlink(out)
          } catch (e) {
            reject(e)
          }
        })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3')
}

/**
 * Convert Audio to WAV
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toWav(buffer, ext) {
  return ffmpeg(buffer, [
    '-acodec', 'pcm_s16le',
    '-ac', '1',
    '-ab', '320k',
    '-ar', '48000',
    '-f', 'wav'
  ], ext, 'wav')
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension 
 */
function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4')
}

/**
 * Mengkonversi video ke resolusi dan bitrate yang diinginkan.
 * @param {Buffer} buffer Buffer video input.
 * @param {string} resolution Resolusi video (contoh: '1280x720').
 * @param {string} videoBitrate Bitrate video (contoh: '2000k').
 * @returns {Promise<Buffer>} Buffer video hasil konversi.
 */
function videoConvert(buffer, input = []) {
    return new Promise(async (resolve, reject) => {
        try {
            const tmp = path.join(__dirname, '../src', `${+new Date()}.mp4`);
            await fs.promises.writeFile(tmp, buffer);
            const out = tmp.replace('.mp4', '_converted.mp4');
            const args = [
                '-y',
                '-i', tmp,
                ...input,
                out
            ];

            spawn('ffmpeg', args)
                .on('error', reject)
                .on('close', async (code) => {
                    try {
                        await fs.promises.unlink(tmp);
                        if (code !== 0) return reject(code);
                        const outputVideoBuffer = await fs.promises.readFile(out);
                        await fs.promises.unlink(out);
                        resolve(outputVideoBuffer);
                    } catch (e) {
                        reject(e);
                    }
                });
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
  toAudio,
  toWav,
  toPTT,
  toVideo,
  ffmpeg,
  videoConvert,
}
