// pages/api/admin/agreements-api.ts
import { ulogger } from "./../../../lib/common/universal-logger";

import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/server/withAuth";

import connectDb from "../../../db/database";
import { getLocaleFromHeader } from "./../../../lib/server/locale";
import { getTypedRepository } from "../../../db/utilites";


import { UserTable } from "./../../../db/models/catalogs/users";
import { AgreementTable } from "./../../../db/models/catalogs/agreements";

interface CreateAgreementBody {
    userId: number;     // кто делает (админ)
    date: string;       // YYYY-MM-DD
    locale: string;     // 'ru' | 'en' | lv ...
    text: string;       // полный текст
}

const normalizeLocale = (v?: string) => (v ?? "").trim().toLowerCase();
const normalizeDate = (v?: string) => (v ?? "").trim();

const isValidDateYYYYMMDD = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const db = await connectDb();

        const localeHeader = getLocaleFromHeader(req.headers["x-lang"]);

        const usersRepository = getTypedRepository(db, "UserTable", UserTable);
        const agreementsRepository = getTypedRepository(db, "AgreementTable", AgreementTable);

        const ensureAdmin = async (userId: number) => {
            const u = await usersRepository.findOne({ where: { id: userId } });
            if (!u) return { ok: false, message: "USER NOT FOUND" };
            if (!u.isSystem && !u.isAdmin) return { ok: false, message: "ACCESS DENIED" };
            if (u.active === false) return { ok: false, message: "USER INACTIVE" };
            return { ok: true, user: u };
        };

        const getAgreements = async () => {
            // Сортировка: date DESC, id DESC
            const items = await agreementsRepository
                .createQueryBuilder("a")
                .orderBy("a.date", "DESC")
                .addOrderBy("a.id", "DESC")
                .getMany();

            return items;
        };

        switch (req.method) {
            case "GET": {
                const { userId } = req.query;

                const adminId = Number(Array.isArray(userId) ? userId[0] : userId);
                if (!adminId) {
                    res.status(200).json({ success: false, message: "USER ID REQUIRED" });
                    return;
                }

                const adm = await ensureAdmin(adminId);
                if (!adm.ok) {
                    res.status(200).json({ success: false, message: adm.message });
                    return;
                }

                const items = await getAgreements();

                res.status(200).json({
                    success: true,
                    items,
                    locale: localeHeader,
                });
                break;
            }
            case "POST": {
                
                const body = req.body as CreateAgreementBody;

                const adminId = Number(body?.userId);
                if (!adminId) {
                    res.status(200).json({ success: false, message: "USER ID REQUIRED" });
                    return;
                }

                const adm = await ensureAdmin(adminId);
                if (!adm.ok) {
                    res.status(200).json({ success: false, message: adm.message });
                    return;
                }

                const date = normalizeDate(body?.date);
                const agLocale = normalizeLocale(body?.locale);
                const text = (body?.text ?? "").trim();

                if (!date || !isValidDateYYYYMMDD(date)) {
                    res.status(200).json({ success: false, message: "INVALID DATE (YYYY-MM-DD REQUIRED)" });
                    return;
                }

                if (!agLocale) {
                    res.status(200).json({ success: false, message: "LOCALE REQUIRED" });
                    return;
                }

                if (!text) {
                    res.status(200).json({ success: false, message: "TEXT REQUIRED" });
                    return;
                }

                // 1) Ищем существующее соглашение с ТАКОЙ ЖЕ ДАТОЙ И ЛОКАЛЬЮ
                const existing = await agreementsRepository.findOne({
                    where: { date, locale: agLocale },
                });

                if (existing) {
                    // 2a) Если есть — обновляем текст (и при желании дату/локаль не трогаем)
                    // created_at обычно не меняем — это дата создания версии
                    await agreementsRepository.update({ id: existing.id }, { text });
                } else {
                    // 2b) Если нет — создаём новое
                    const entity = agreementsRepository.create({
                        date,
                        locale: agLocale,
                        text,
                    });
                    await agreementsRepository.save(entity);
                }

                // 3) Возвращаем обновлённый список
                const items = await getAgreements();

                res.status(200).json({
                    success: true,
                    items,
                });
                break;
            }


            default:
                res.status(405).json({ error: "Method not supported." });
        }
    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) error = e.message;

        void ulogger
            .error({
                userId: null,
                location: "pages/api/admin/agreements-api",
                event: "api_error",
                message: `catch: ${error}`,
                context: "",
            })
            .catch(() => {
                console.error("logger error");
            });

        res.status(500).json({ error: `${error}` });
    }
};

export default withAuth(handler);
