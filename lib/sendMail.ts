// lib/mail/sendMail.ts
import nodemailer from 'nodemailer';

const tx = nodemailer.createTransport({
  host: process.env.SMTP_HOST!, port: Number(process.env.SMTP_PORT||587), secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! }
});
export async function sendVerificationMail(to: string, code: string, purpose: string, locale: 'ru'|'en'='ru') {
  const subj = locale==='ru' ? 'Код подтверждения' : 'Verification code';
  const text = locale==='ru'
    ? `Ваш код (${purpose}): ${code}\nДействителен 10 минут.`
    : `Your code (${purpose}): ${code}\nValid for 10 minutes.`;
  await tx.sendMail({ from: process.env.MAIL_FROM || 'no-reply@example.com', to, subject: subj, text });
}
