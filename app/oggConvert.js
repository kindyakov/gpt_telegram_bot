import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from '@ffmpeg-installer/ffmpeg'
import { createWriteStream } from 'fs'
import { dirname, resolve } from "path";
import { fileURLToPath } from 'url'
import { removeFile } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path)
  }

  async toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`)
      return new Promise((resolve, reject) => {
        ffmpeg(input)
          .inputOption('-t 300')
          .output(outputPath)
          .on('end', () => {
            removeFile(input)
            resolve(outputPath)
          })
          .on('error', err => reject(err.message))
          .run()
      })
    } catch (error) {
      console.log('Ошибка создание mp3', err.message)
    }
  }

  async create(url, fileName) {
    try {
      const oggPath = resolve(__dirname, '../voices', `${fileName}.ogg`)

      const response = await axios({
        method: 'get',
        url, responseType: 'stream'
      })

      return new Promise(resolve => {
        const stream = createWriteStream(oggPath)
        response.data.pipe(stream)
        stream.on('finish', () => resolve(oggPath))
      })
    } catch (error) {
      console.log('Ошибка создание ogg', error.message)
    }
  }
}

export const oggConverter = new OggConverter