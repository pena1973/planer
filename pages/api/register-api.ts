import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения
import { extractIdFromTeamNumber } from '@/utils';

import { UserTable } from '@/db/models/catalogs/users';
import { TeamTable } from '@/db/models/catalogs/teams';
import { UserAgreeTable } from '@/db/models/catalogs/user_agree';
import { AgreementTable } from '@/db/models/catalogs/agreements';
import { SettingsTable } from '@/db/models/plan/settings'

import { updateSettings } from '@/handlers/handlers-update';  // расчеты

import { TeamItem, UserItem, SettingsItem} from '@/types/types';

import { sign } from 'jsonwebtoken';
import { createNewTeam, createNewUser, getTeam, 
  isUserExist, getLastAgreement } from '@/handlers/handlers-auth';  // расчеты

interface RequestBody {
  login: string,
  pass: string,
  teamNumber: string,
  createTeam: boolean,
  nickname: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const usersRepository = dbConnection.getRepository(UserTable);
    const teamsRepository = dbConnection.getRepository(TeamTable);
    const userAgreeRepository = dbConnection.getRepository(UserAgreeTable);
    const agreementRepository = dbConnection.getRepository(AgreementTable);
    const settingsRepository = dbConnection.getRepository(SettingsTable);

    switch (req.method) {
      // регистер
      case 'POST':
        // Извлекаем данные из тела запроса
        const { login, pass, teamNumber, createTeam, nickname } = req.body as RequestBody;

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
          const resTeam = await createNewTeam(teamsRepository);

          if (!resTeam.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
            return;
          }

          team = resTeam.team

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


        // Настройки команды
        const settings = {
          timeStartWork: 0,
          timeFinishWork: 1440,
          showWeekend: false,
          showHoliday: false,
          isQualControl: true
        }
        const resSettings = await updateSettings(
          settingsRepository,
          settings,
          team.id
        )
        if (!resSettings.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSettings.message });
          return;
        }

        const savedSettings = resSettings.savedSettings as SettingsItem;  //  можно сразу привести типы простые

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

        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
          token: token,
          user: savedUser,
          agreementText: agreementText,
          agreementId: agreementId,
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

