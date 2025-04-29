import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { generateTeamNumber, extractIdFromTeamNumber } from '@/utils';

import { UserTable } from '@/pages/db/models/catalogs/users';
import { TeamTable } from '@/pages/db/models/catalogs/teams';
import { UserUnitTable } from '@/pages/db/models/catalogs/user_unit';
import { UnitTable } from '../db/models/catalogs/units';

import { Repository } from 'typeorm';
import { TeamItem, UserItem } from '@/types';
import { sign } from 'jsonwebtoken';
// import { getUser, createNewTeam, createNewUser, getTeam, getLastAgreement } from './handlers-auth';  // расчеты
import { getUsersUnits } from './handlers-get';  // расчеты

import { text } from 'stream/consumers';


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
    const usersUnitsRepository = dbConnection.getRepository(UserUnitTable);
    const unitsRepository = dbConnection.getRepository(UnitTable);


    // userId, teamId в любом случае
    const { userId, teamId } = req.query;


    switch (req.method) {

      case 'GET':
        //  получаем назначенные и получаем всех юзеров  и соединяем левым соединением
        const resUserUnits = await getUsersUnits(
          Number(teamId),
            usersRepository,
            usersUnitsRepository,
            unitsRepository
            // Number(teamId), actionsRepository
          )

        if (!resUserUnits.success) {
          res.status(200).json({
            success: false,           
            message: resUserUnits.message,
          });
          ;
        }
        res.status(200).json({
          success: true,
          users_units: resUserUnits.userUnits,
          message: resUserUnits.message,
        });


        break;
      // регистер
      // case 'POST':
      //   // Извлекаем данные из тела запроса
      //   const { login, pass } = req.body as RequestBody;

      //   const resUser = await getUser(login, pass, usersRepository)
      //   if (!resUser.success) {
      //     res.status(200).json({
      //       success: false,
      //       message: resUser.message,
      //     });
      //     ;
      //   }
      //   const user = resUser.user as UserItem;

      //   const resTeam = await getTeam(user.id, teamsRepository)

      //   if (!resTeam.success) {
      //     res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUser.message });
      //     break;
      //   }

      //   const team = resTeam.team;

      //   //  юзер получен проверяю актуальное соглашение
      //   const resAgreement = await getLastAgreement(user.id, userAgreeRepository, agreementRepository)
      //   //  { text: string, signed: boolean, dateSigned?: string, message?: string }> 

      //   const signed = resAgreement.signed;
      //   const agreementText = resAgreement.agreementText;
      //   const dateSigned = signed ? resAgreement.dateSigned : null;
      //   const agreementId = resAgreement.agreementId;

      //   //  юзер получен генерю токен
      //   const token = sign({ data: login }, String(process.env.JWTSECRET), { expiresIn: '24h' });

      //   // отправляем ответ
      //   res.status(200).json({
      //     success: true,
      //     team: team,
      //     token: token,
      //     user: user,
      //     agreementText: agreementText,
      //     agreementId: agreementId,
      //     signed: signed,
      //     dateSigned: dateSigned,
      //   });
      //   break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (login-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

