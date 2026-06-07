import { config } from 'dotenv'
config()

function num(key: string, fallback: number): number {
  return Number(process.env[key]) || fallback
}

export const env = {
  PORT: num('PORT', 4001),
  BIND: process.env.BIND || '127.0.0.1',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
}
