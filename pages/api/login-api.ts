import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения

import { UserTable } from '@/pages/db/models/catalogs/users';
import { TeamTable } from '@/pages/db/models/catalogs/teams';
import { UserAgreeTable } from '@/pages/db/models/catalogs/user_agree';
import { AgreementTable } from '../db/models/catalogs/agreements';
import { UserUnitTable } from '../db/models/catalogs/user_unit';

import { UserItem } from '@/types';
import { createAccessToken, createRefreshToken } from '@/lib/auth'
import { getUser, getTeam, getLastAgreement } from './handlers-auth';  // расчеты
import { getUsersUnits } from './handlers-get';  // расчеты


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
    const usersUnitsRepository = dbConnection.getRepository(UserUnitTable);


    switch (req.method) {
      // регистер
      case 'POST':
        // Извлекаем данные из тела запроса
        const { login, pass } = req.body as RequestBody;

        const resUser = await getUser(login, pass, usersRepository)
        if (!resUser.success) {
          res.status(200).json({
            success: false,
            message: resUser.message,
          });
          return;
        }
        const user = resUser.user as UserItem;

        const resTeam = await getTeam(user.id, teamsRepository)

        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUser.message });
          return;
        }

        const team = resTeam.team;


        //  юзер получен проверяю актуальное соглашение
        const resAgreement = await getLastAgreement(user.id, userAgreeRepository, agreementRepository)
        //  { text: string, signed: boolean, dateSigned?: string, message?: string }> 

        const signed = resAgreement.signed;
        const agreementText = resAgreement.agreementText;
        const dateSigned = signed ? resAgreement.dateSigned : null;
        const agreementId = resAgreement.agreementId;

        //  юзер получен генерю токен
        // const token = sign({ data: login }, String(process.env.JWTSECRET), { expiresIn: '24h' });

        // const token = createToken({ login })
        const accessToken = createAccessToken({ login })
        const refreshToken = createRefreshToken({ login })

        // Устанавливаем refresh в HttpOnly cookie
        res.setHeader('Set-Cookie', [
          `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 дней
        ])


        //  получаю Юнит который занимает юзер
        //  получаем назначенные и получаем всех юзеров  и соединяем левым соединением
        const resUserUnits_ = await getUsersUnits(
          team.id,
          usersRepository,
          usersUnitsRepository,
        )

        if (!resUserUnits_.success) {
          res.status(200).json({
            success: false,
            message: resUserUnits_.message,
          });
          ;
        }

        const unit = (resUserUnits_.userUnits.length > 0) ? resUserUnits_.userUnits[0].unit : undefined

        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
          token: accessToken ,
          user: user,
          agreementText: agreementText,
          agreementId: agreementId,
          signed: signed,
          dateSigned: dateSigned,
          unit: unit,
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (login-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

