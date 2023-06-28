import { openai } from "./openai.js";
import { oggConverter } from "./oggConvert.js"
import { INITIAL_SESSION } from "../server.js";
import { processTextToChat } from "./logic.js";
import { getSpeechFile } from "./getSpeechFile.js";
import { removeFile } from './utils.js'
import { bot } from "../server.js";
import { Markup } from "telegraf";

let buttonOptions = Markup.inlineKeyboard([
  [Markup.button.callback('Озвучить', 'voiceBtn')]
])

const handlerVoiceBtn = async (ctx, responseGPT) => {
  try {
    console.error('click')
    // Голосовой ответ от яндекс speeshKit
    const oggfilePath = await getSpeechFile(responseGPT)
    console.log('Ответ от speechKit получен')
    // путь mp3 файла
    const mp3PathGpt = await oggConverter.toMp3(oggfilePath, 'speech')
    console.log('Файл сконвертирован')

    await ctx.replyWithVoice({ source: mp3PathGpt });
    // removeFile(oggfilePath)
    removeFile(mp3PathGpt)
  } catch (error) {
    console.log('Ошибка при клику на кнопку: ', error.message)
  }
}

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
    console.log('Ответ от gtp получен')
    // удаляем сообщение
    await ctx.deleteMessage(messageToDeleteId);
    await ctx.reply(`<b>Ваш запрос:</b> <i>${text}</i>`,
      { parse_mode: 'HTML' })
    await ctx.reply(responseGPT, buttonOptions)
    removeFile(mp3Path)

    bot.action('voiceBtn', async ctx => await handlerVoiceBtn(ctx, responseGPT));
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
    console.log('Ответ от gtp получен')

    // удаляем сообщение
    await ctx.deleteMessage(messageToDeleteId);
    await ctx.reply(responseGPT, buttonOptions)

    bot.action('voiceBtn', async ctx => await handlerVoiceBtn(ctx, responseGPT));
  } catch (error) {
    console.log(`Ошибка текстового сообщения`, error.message)
  }
}