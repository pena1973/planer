//pages/api/auth/register-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { extractIdFromTeamNumber } from './../../../lib/common/utils';

import { UserTable } from './../../../db/models/catalogs/users';
import { TeamTable } from './../../../db/models/catalogs/teams';
import { UserAgreeTable } from './../../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../../db/models/catalogs/agreements';
import { SettingsTable } from './../../../db/models/plan/settings'
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { ActiveTimeTable } from './../../../db/models/billing/active_time'
import { BalanceTable } from './../../../db/models/billing/balance'


import { getCurrentDateInString } from "./../../../lib/common/timezone"
import { TeamItem, UserItem, TimeZoneEnum } from './../../../types/types';

import { sign } from 'jsonwebtoken';
import { createNewTeam, createNewUser, getTeam, isUserExist, getLastAgreement} from './../../../handlers/handlers-auth';

import { updateBalance } from './../../../handlers/handlers-update';

interface RequestBody {
  login: string,
  pass: string,
  teamNumber: string,
  createTeam: boolean,
  nickname: string,
  basedOnTeam: boolean,
  basedTeamNumber: string,
  timezone: TimeZoneEnum
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDb();

    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
    const agreementRepository = getTypedRepository(db, 'AgreementTable', AgreementTable);
    const settingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
    const active_timeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
    const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { login, pass, teamNumber, createTeam, nickname, basedOnTeam, basedTeamNumber, timezone } = req.body as RequestBody;

        // проверяем  есть ли такой логин  если есть - отказ
        const isUserExist_ = await isUserExist(login, usersRepository)
        if (isUserExist_) {
          // юзер существует второй раз нельзя зарегистрировать
          res.status(200).json({
            success: false,
            // message: " Ошибка, пользователь с таким логином уже существует, если забыли пароль, воспользуйтесь функцией восстановления пароля",
            message: `${'mes.userAlreadyExists'}`,
          });
          return;
        }

        // Команда
        let team = {} as TeamItem;
        // если создаем команду 
        if (Boolean(createTeam)) {
          // Внутри создания команды автозаполнение настроек и расписания
          const resTeam = await createNewTeam(
            null,
            locale,
            teamsRepository,
            active_timeRepository,
            settingsRepository,
            teamScheduleRepository,
            timezone,
            (basedOnTeam) ? basedTeamNumber : null,);

          if (!resTeam.success) {
            res.status(200).json({
              success: false,
              message: resTeam.message,
            });
            return;
          }
          team = resTeam.team;
        } else {
          //  иначе ищем команду по номеру
          const teamId = extractIdFromTeamNumber(teamNumber);

          const resTeam1 = await getTeam(null, locale, teamId, teamsRepository)

          if (!resTeam1.success || !resTeam1.team) {
            res.status(200).json({
              success: false,
              message: resTeam1.message,
            });
            return;
          }
          team = resTeam1.team;
        }

        // Юзер

        const resNewUser = await createNewUser(
          locale,
          login,
          pass,
          team.id,
          createTeam,
          nickname,
          usersRepository);

        if (!resNewUser.success) {
          res.status(200).json({
            success: false,
            message: resNewUser.message,
          });
          return;
        }

        const savedUser = resNewUser.savedUser as UserItem;

        //  юзер записался генерю токен
        const token = sign({ data: login }, String(process.env.JWTSECRET), { expiresIn: '24h' });

        //  юзер получен проверяю актуальное соглашение
        const resAgreement = await getLastAgreement(savedUser.id, locale, userAgreeRepository, agreementRepository)
        //  { text: string, signed: boolean, dateSigned?: string, message?: string }> 

        const agreementText = resAgreement.agreementText;
        const agreementId = resAgreement.agreementId;

        const todayStr = getCurrentDateInString(timezone)
        // проводка пополнения  баланса  при создании новой независимой команды в режиме триал
        if (!basedOnTeam) {
          const balanceRes = await updateBalance(
            savedUser.id,
            locale,
            balanceRepository,
            team.id,
            "",
            100,
            todayStr,
            true,
            'trial - ' + todayStr, "+", "")

          if (!balanceRes.success) {
            console.log("баланс не пополнен  trial, teamId:" + team.id);
            //  logger
            void ulogger.error({
              userId: null,
              location: "pages/api/auth/register-api",
              event: "error",
              message: "баланс не пополнен  trial, teamId:" + team.id,
              context: " const balanceRes = await updateBalance(",
            }).catch(() => { console.error("logger error") });
          }
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
          token: token,
          user: savedUser,
          agreementText: agreementText,
          agreementId: agreementId,
          activeTeam: true,
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
      location: "pages/api/auth/confirm-email-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

