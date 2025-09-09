import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'

import { extractIdFromTeamNumber } from './../../../lib/utils';

import { UserTable } from './../../../db/models/catalogs/users';
import { TeamTable } from './../../../db/models/catalogs/teams';
import { UserAgreeTable } from './../../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../../db/models/catalogs/agreements';
import { SettingsTable } from './../../../db/models/plan/settings'
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { ActiveTimeTable } from './../../../db/models/billing/active_time'
import { BalanceTable } from './../../../db/models/billing/balance'

import { updateSettings } from './../../../handlers/handlers-update';  // расчеты
import { getCurrentDateInString } from "./../../../lib/timezone"
import { TeamItem, UserItem, TimeZoneEnum, ScheduleItem, SettingsItem } from './../../../types/types';

import { sign } from 'jsonwebtoken';
import {
  createNewTeam, createNewUser, getTeam,
  isUserExist, getLastAgreement
} from './../../../handlers/handlers-auth';

import { updateBalance } from './../../../handlers/handlers-update';
import { assert } from 'console';

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

  const db = await connectDb();

  const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
  const agreementRepository = getTypedRepository(db, 'AgreementTable', AgreementTable);
  const settingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
  const active_timeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);


  try {

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
            message: " Ошибка, пользователь с таким логином уже существует, если забыли пароль, воспользуйтесь функцией восстановления пароля",
          });
          return;
        }

        // Команда
        let team = {} as TeamItem;
        // если создаем команду 
        if (Boolean(createTeam)) {
          // Внутри создания команды автозаполнение настроек и расписания
          const resTeam = await createNewTeam(
            teamsRepository,
            active_timeRepository,
            settingsRepository,
            teamScheduleRepository,
            timezone,
            (basedOnTeam) ? basedTeamNumber : null,);

          if (!resTeam.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
            return;
          }

          team = resTeam.team;


        } else {
          //  иначе ищем команду по номеру
          const teamId = extractIdFromTeamNumber(teamNumber);

          const resTeam1 = await getTeam(teamId, teamsRepository)

          if (!resTeam1.success || !resTeam1.team) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam1.message });
            return;
          }
          team = resTeam1.team;

        }

        // Юзер

        const resNewUser = await createNewUser(
          login,
          pass,
          team.id,
          createTeam,
          nickname,
          usersRepository);

        if (!resNewUser.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resNewUser.message });
          return;
        }

        const savedUser = resNewUser.savedUser as UserItem;

        //  юзер записался генерю токен
        const token = sign({ data: login }, String(process.env.JWTSECRET), { expiresIn: '24h' });

        //  юзер получен проверяю актуальное соглашение
        const resAgreement = await getLastAgreement(savedUser.id, userAgreeRepository, agreementRepository)
        //  { text: string, signed: boolean, dateSigned?: string, message?: string }> 

        const agreementText = resAgreement.agreementText;
        const agreementId = resAgreement.agreementId;

        const todayStr = getCurrentDateInString(timezone)
        // проводка пополнения  баланса  при создании новой независимой команды в режиме триал
        if (!basedOnTeam) {
          const balanceRes = await updateBalance(
            balanceRepository,
            team.id,
            "",
            100,
            // new Date().toLocaleDateString('en-CA'),
            todayStr,
            true,
            // 'trial - ' + new Date().toLocaleDateString('en-CA'), "+", "")
            'trial - ' + todayStr, "+", "")
          if (!balanceRes.success) {
            console.log("баланс не пополнен  trial, teamId:" + team.id);
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
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (register-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

