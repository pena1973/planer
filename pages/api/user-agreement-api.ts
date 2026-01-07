// pages/api/user_agreement-api.ts
// API для подписания соглашения (agreement)
// Используется при согласии пользователя с условиями соглашения
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../lib/server/locale';

import { getTypedRepository } from './../../db/utilites'
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { UserTable } from './../../db/models/catalogs/users';
import { ActiveTimeTable } from './../../db/models/billing/active_time'
import { BalanceTable } from './../../db/models/billing/balance'
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { updateBalance } from './../../handlers/handlers-update';
import { signAgreement, getUserById } from './../../handlers/handlers-auth';
import { getCurrentDateInString, } from "@/lib/common/timezone"

interface RequestBody {
  userId: number,
  signedAgreement: boolean,
  agreementId: number,
  agreement_text_snapshot: string,
  agreement_locale: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDb();

    const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
    const userRepository = getTypedRepository(db, 'UserTable', UserTable);
    const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
    const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
    const teamsSheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes');

    switch (req.method) {
      case 'POST':

        const { userId, signedAgreement, agreementId, agreement_text_snapshot, agreement_locale } = req.body as RequestBody;
        
        let setedActiveTeam = false;// флаг что это начальная регистрация и нужно установить активное время команды

        if (!agreementId) {
          res.status(200).json({
            success: true,
            signed: false,
            // message: "нет соглашения нечего подписывать",
            message: t("mes.noAgreementToSign"),
          });

          res.status(200).json({
            success: true,
            signed: false,
          });
          return;
        }

        // проверяем  есть ли такой логин  если есть - отказ
        const resUserAgree = await signAgreement(userId, locale, signedAgreement, agreementId, agreement_text_snapshot, agreement_locale, userAgreeRepository)
        if (!resUserAgree.success) {
          res.status(200).json({
            success: false,
            signed: resUserAgree.signed,
            message: resUserAgree.message,
          });
          return;
        }

        // если юзер подписал
        if (resUserAgree.signed) {
          const user = await getUserById(Number(userId), Number(userId), locale, userRepository);
          // если юзер админ команды
          if (user?.isAdmin) {
            // получаем информацию было ли у него активное время и баланс
            const activeTimes = await activeTimeRepository.find({ where: { team_id: user.teamId } });
            const balances = await balanceRepository.find({ where: { team_id: user.teamId } });
            const teamsShedule = await teamsSheduleRepository.findOne({ where: { id: user.teamId } });
            const dateStr = (teamsShedule) ? getCurrentDateInString(teamsShedule?.timeZone) : getCurrentDateInString('UTC');

            // если не было активного времени  значит первый раз подписывает соглашение  устанавливаем активное время работы команды            
            if (activeTimes.length === 0) {
              const active_time = activeTimeRepository.create({
                date: dateStr,
                direction: "start",
                team_id: user.teamId
              });
              const savedactive_time = await activeTimeRepository.save(active_time);
              
            }
            // если записей баланса не было  значит первый раз подписывает соглашение  устанавливаем триальный баланс 100  единиц
            if (balances.length === 0) {
             
              const balanceRes = await updateBalance(
                userId,
                locale,
                balanceRepository,
                user.teamId,
                "trial",
                100,
                dateStr,
                true,
                false,
                'trial - ' + dateStr, "+", "")
 
              if (balanceRes.success)  setedActiveTeam = true;

              if (!balanceRes.success) {
                console.log("баланс не пополнен  trial, teamId:" + user.teamId);
                //  logger
                void ulogger.error({
                  userId: null,
                  location: "pages/api/auth/register-api",
                  event: "error",
                  message: "баланс не пополнен  trial, teamId:" + user.teamId,
                  context: " const balanceRes = await updateBalance(",
                }).catch(() => { console.error("logger error") });
              }
            }
          }
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          signed: resUserAgree.signed,
          setedActiveTeam: setedActiveTeam,
        });
        break;
      default:
        res.status(405).json({ error: 'Method not supported.' });
    }

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/user_agreement-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

