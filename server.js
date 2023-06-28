import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import { voiceMessage, textMessage } from "./app/message.js";
import { start } from "./app/command.js";
import dotenv from "dotenv";

dotenv.config()

export const INITIAL_SESSION = { messages: [] }
export const bot = new Telegraf(process.env.TELEGRAM_TOKEN_BOT)

bot.use(session())

bot.command('new', start)

bot.command('start', start)

// Голосовые сообщения
bot.on(message('voice'), voiceMessage)
// Текстовые сообщения
bot.on(message('text'), textMessage)

bot.launch()

process.once("SIGINT", () => bot.stop('SIGINT'))
process.once("SIGTERM", () => bot.stop('SIGTERM'))