import { INITIAL_SESSION } from "../server.js";

export const start = async ctx => {
  try {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду вашего голосового или текстового сообщения')
  } catch (error) {
    console.log('Ошибка в команде /start and /new:', error.message);
  }
}