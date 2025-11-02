import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, name, email, company, time, message } = req.body || {};

  // TODO: вставь свою логику — SendGrid/Mailgun/SMTP/Telegram и т.д.
  // Здесь просто лог и 200.
  console.log("[CONTACT]", { type, name, email, company, time, message });

  return res.status(200).json({ ok: true });
}
