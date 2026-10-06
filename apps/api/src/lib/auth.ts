import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type SessionPayload = { userId: string; role: 'STUDENT' | 'ADMIN'; version: number };

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.sessionTtlHours * 3600, algorithm: 'HS256', issuer: 'campus-updates' });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'campus-updates' }) as SessionPayload;
}

export function randomToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function randomCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashToken(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
