// lib/auth/code.ts
import crypto from 'crypto';
import { scryptHash, scryptVerify } from '@/lib/scrypt';

export function genCode(len = 6) {
  const b = crypto.randomBytes(len);
  let s = ''; for (let i = 0; i < len; i++) s += (b[i] % 10).toString();
  return s; // только цифры
}

export const hashCode = scryptHash;
export const checkCode = scryptVerify;

export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
