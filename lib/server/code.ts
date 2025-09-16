// lib/server/code.ts 
// Утилиты для генерации, хэширования и проверки кодов верификации email/sms

// import 'server-only';
// import crypto from 'crypto';
// import { scryptHash, scryptVerify } from '@/lib/server/scrypt';

// export function genCode(len = 6) {
//   const b = crypto.randomBytes(len);
//   let s = ''; for (let i = 0; i < len; i++) s += (b[i] % 10).toString();
//   return s; // только цифры
// }

// export const hashCode = scryptHash;
// export const checkCode = scryptVerify;

// export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000); // m*60*1000


// lib/server/code.ts 
// Утилиты для генерации, хэширования и проверки кодов верификации email/sms

// import 'server-only';
// import { scryptHash, scryptVerify } from '@/lib/server/scrypt';

// export async function genCode(len = 6): Promise<string> {
//   // Динамически загружаем crypto только при вызове
//   const { randomBytes } = await import('crypto');
//   const b = randomBytes(len);
//   let s = '';
//   for (let i = 0; i < len; i++) s += (b[i] % 10).toString();
//   return s; // только цифры
// }

// export const hashCode = scryptHash;
// export const checkCode = scryptVerify;

// export const addMinutes = (d: Date, m: number) =>
//   new Date(d.getTime() + m * 60000);

// lib/server/code.ts
// Утилиты для генерации, хэширования и проверки кодов верификации email/sms

import { scryptHash, scryptVerify } from '@/lib/server/scrypt';

export function genCode(len = 6): string {
  // избегаем статического импорта: webpack не видит 'crypto'
  const req = eval('require') as NodeJS.Require;
  const { randomBytes } = req('crypto') as typeof import('crypto');

  const b = randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += (b[i] % 10).toString();
  return s; // только цифры
}

export const hashCode = scryptHash;
export const checkCode = scryptVerify;

export const addMinutes = (d: Date, m: number) =>
  new Date(d.getTime() + m * 60000);
