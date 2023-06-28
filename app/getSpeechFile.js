import axios from "axios";
import config from "config";
import fs from 'fs'
import { dirname, resolve } from "path";
import { fileURLToPath } from 'url'
import dotenv from "dotenv";
dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

export const getSpeechFile = async text => {
  try {
    const params = {
      text: text,
      lang: 'ru-RU',
      voice: 'zahar',
      // emotion: 'neutral',
      folderId: process.env.FOLDER_ID,
    }
    const queryString = new URLSearchParams(params).toString();
    const requestUrl = `${config.get('SPEECH_URL')}?${queryString}`;

    // const response = await axios.post(url, {
    //   params,
    //   headers: {
    //     Authorization: `Api-Key ${process.env.SPEECH_KEY}`,
    //     'content-type': 'application/x-www-form-urlencoded'
    //   },
    //   responseType: "stream",
    // });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Api-Key ${process.env.SPEECH_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      responseType: 'stream',
    });

    const buffer = await response.arrayBuffer()
    const view = new Uint8Array(buffer);
    const filePath = resolve(__dirname, '../voices', 'speech.ogg')
    const writeStream = fs.createWriteStream(filePath);

    writeStream.write(view)

    writeStream.on('finish', () => {
      console.log('Поток записи завершил запись данных.');
    });

    writeStream.on('error', (error) => {
      console.error('Ошибка при записи данных в файл', error);
      writeStream.end();
    });

    return filePath
  } catch (error) {
    console.log('Ошибка в getSpeechFile: ', error);
  }
}