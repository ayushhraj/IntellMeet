import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'intellmeet-access-secret-dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'intellmeet-refresh-secret-dev',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  stun: process.env.STUN_URL || 'stun:stun.l.google.com:19302',
  turn: {
    url: process.env.TURN_URL || '',
    username: process.env.TURN_USERNAME || '',
    password: process.env.TURN_PASSWORD || '',
  },
};
