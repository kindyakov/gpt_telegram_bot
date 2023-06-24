import express from "express";
import cors from "cors";
import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import config from 'config'
import { voiceMessage, textMessage } from "./app/message.js";
import { start } from "./app/command.js";


const app = express();

export const INITIAL_SESSION = { messages: [] }

const bot = new Telegraf(config.get('TELEGRAM_TOKEN_BOT'))

app.use(cors()) // для отправки запросов с браузера
app.use(express.json())

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