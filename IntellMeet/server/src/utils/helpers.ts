import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
};

export const generateRoomId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [3, 4, 3].map((len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return segments.join('-');
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
