import { openai } from "./openai.js";
import { oggConverter } from "./oggConvert.js"
import { INITIAL_SESSION } from "../server.js";
import { processTextToChat } from "./logic.js";
import { getSpeechFile } from "./getSpeechFile.js";

export const voiceMessage = async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply('Обрабатываю ваш запрос...')
    const messageToDeleteId = ctx.message.message_id + 1;
    // сылка на файл с голосовым сообщением
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    // путь ogg файла
    const oggPath = await oggConverter.create(link.href, userId)
    // путь mp3 файла
    const mp3Path = await oggConverter.toMp3(oggPath, userId)
    // текст из голосового сообщения
    const text = await openai.transcription(mp3Path)
    // Ответ gtp
    const responseGPT = await processTextToChat(ctx, text)
    // Голосовой ответ от яндекс speeshKit
    const filePath = await getSpeechFile(responseGPT)
    // путь mp3 файла
    const mp3PathGpt = await oggConverter.toMp3(filePath, 'speech')
    // удаляем сообщение
    await ctx.deleteMessage(messageToDeleteId);
    await ctx.reply(`<b>Ваш запрос:</b> <i>${text}</i>`,
      { parse_mode: 'HTML' })
    ctx.reply(responseGPT)
    ctx.replyWithVoice({ source: mp3PathGpt });
  } catch (error) {
    console.log(`Ошибка голосового сообщения`, error.message)
  }
}

export const textMessage = async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply('Обрабатываю ваш запрос...')
    const messageToDeleteId = ctx.message.message_id + 1;
    // Ответ gtp
    const responseGPT = await processTextToChat(ctx, ctx.message.text)
    // Голосовой ответ от яндекс speeshKit
    const filePath = await getSpeechFile(responseGPT)
    // путь mp3 файла
    const mp3PathGpt = await oggConverter.toMp3(filePath, 'speech')
    // удаляем сообщение
    await ctx.deleteMessage(messageToDeleteId);
    ctx.reply(responseGPT)
    ctx.replyWithVoice({ source: mp3PathGpt });
  } catch (error) {
    console.log(`Ошибка текстового сообщения`, error.message)
  }
}