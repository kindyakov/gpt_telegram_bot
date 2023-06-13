import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { oggConverter } from "./app/oggConvert.js";
import { openai } from "./app/openai.js";

const INITIAL_SESSION = {
  messages: []
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN_BOT'))

bot.use(session())

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})


bot.on(message('voice'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Обрабатываю ваш запрос...'))
    // сылка на файл с голосовым сообщением
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    // путь ogg файла
    const oggPath = await oggConverter.create(link.href, userId)
    // путь mp3 файла
    const mp3Path = await oggConverter.toMp3(oggPath, userId)
    // текст из голосового сообщения
    const text = await openai.transcription(mp3Path)

    ctx.session.messages.push({ role: openai.roles.USER, content: text })

    const response = await openai.chat(ctx.session.messages)

    ctx.reply(code(`Ваш запрос: ${text}`))

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })

    ctx.reply(response.content)
  } catch (error) {
    console.log(`Ошибка голосового сообщения`, error.message)
  }
})

bot.on(message('text'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Обрабатываю ваш запрос...'))

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text
    })

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })

    ctx.reply(response.content)
  } catch (error) {
    console.log(`Ошибка текстового сообщения`, error.message)
  }
})

bot.launch()

process.once("SIGINT", () => bot.stop('SIGINT'))
process.once("SIGTERM", () => bot.stop('SIGTERM'))