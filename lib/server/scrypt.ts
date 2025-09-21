// // lib/scrypt.ts
// import 'server-only';
// import {
//   randomBytes,
//   scrypt as scryptCb,
//   timingSafeEqual,
//   type ScryptOptions,
// } from 'node:crypto';

// type ScryptParams = { N: number; r: number; p: number; keylen: number };
// const DEFAULT: ScryptParams = { N: 16384, r: 8, p: 1, keylen: 64 };

// // Обертка над колбэк-версией scrypt -> Promise<Buffer>
// function scryptAsync(
//   password: string | Buffer,
//   salt: Buffer,
//   keylen: number,
//   options: ScryptOptions
// ): Promise<Buffer> {
//   return new Promise((resolve, reject) => {
//     scryptCb(password, salt, keylen, options, (err, derivedKey) => {
//       if (err) return reject(err);
//       resolve(derivedKey as Buffer);
//     });
//   });
// }

// export async function scryptHash(
//   plain: string,
//   opts: Partial<ScryptParams> = {}
// ): Promise<string> {
//   const { N, r, p, keylen } = { ...DEFAULT, ...opts };
//   const salt = randomBytes(16);
//   const dk = await scryptAsync(plain, salt, keylen, { N, r, p });
//   // Формат: scrypt$N$r$p$base64(salt)$base64(hash)
//   return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${dk.toString('base64')}`;
// }

// export async function scryptVerify(plain: string, encoded: string): Promise<boolean> {
//   try {
//     const [alg, n, r, p, saltB64, hashB64] = encoded.split('$');
//     if (alg !== 'scrypt') return false;
//     const N = Number(n), R = Number(r), P = Number(p);
//     const salt = Buffer.from(saltB64, 'base64');
//     const hash = Buffer.from(hashB64, 'base64');
//     const dk = await scryptAsync(plain, salt, hash.length, { N, r: R, p: P });
//     return timingSafeEqual(dk, hash);
//   } catch {
//     return false;
//   }
// }
// lib/scrypt.ts
// scrypt-хеш/проверка без статических импортов crypto


// Получаем core-модуль Node только в рантайме (не светим сборщику)
function getCrypto() {
  const req = eval('require') as NodeJS.Require;
  return req('crypto') as typeof import('crypto');
}

type ScryptParams = { N?: number; r?: number; p?: number; keylen?: number };
const DEFAULT: Required<ScryptParams> = { N: 16384, r: 8, p: 1, keylen: 64 };

function getUtil() {
  const req = eval('require') as NodeJS.Require;
  return req('util') as typeof import('util');
}

function scryptAsync(
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number }
): Promise<Buffer> {
  const { scrypt } = getCrypto();
  const { promisify } = getUtil();
  const scryptProm = promisify(scrypt) as (
    pwd: string | Buffer,
    salt: Buffer | string,
    keylen: number,
    opts: { N: number; r: number; p: number; maxmem?: number }
  ) => Promise<Buffer>;

  return scryptProm(password, salt, keylen, options);
}


export async function scryptHash(
  plain: string,
  opts: ScryptParams = {}
): Promise<string> {
  const { randomBytes } = getCrypto();
  const { N, r, p, keylen } = { ...DEFAULT, ...opts };
  const salt = randomBytes(16);
  const dk = await scryptAsync(plain, salt, keylen, { N, r, p });
  // Формат: scrypt$N$r$p$base64(salt)$base64(hash)
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${dk.toString('base64')}`;
}

export async function scryptVerify(plain: string, encoded: string): Promise<boolean> {
  try {
    const [alg, n, rStr, pStr, saltB64, hashB64] = encoded.split('$');
    if (alg !== 'scrypt') return false;

    const N = Number(n);
    const r = Number(rStr);
    const p = Number(pStr);

    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');

    const dk = await scryptAsync(plain, salt, expected.length, { N, r, p });

    const { timingSafeEqual } = getCrypto();
    return timingSafeEqual(dk, expected);
  } catch {
    return false;
  }
}
