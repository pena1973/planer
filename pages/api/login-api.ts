import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';  // Импортируем функцию подключения

import { UserTable } from './../../db/models/catalogs/users';
import { TeamTable } from './../../db/models/catalogs/teams';
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../db/models/catalogs/agreements';
import { UserUnitTable } from './../../db/models/catalogs/user_unit';

import { UserItem } from './../../types/types';
import { createAccessToken, createRefreshToken } from './../../lib/auth'
import { getTypedRepository } from './../../lib/db/utilites'
import { getUser, getTeam, getLastAgreement } from './../../handlers/handlers-auth';  // расчеты
import { getUsersUnits } from './../../handlers/handlers-get';  // расчеты


interface RequestBody {
  login: string,
  pass: string,
  teamNumber: string,
  createTeam: boolean,
  nickname: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const db = await connectDb();

  const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
  const agreementRepository = getTypedRepository(db, 'AgreementTable', AgreementTable);
  const usersUnitsRepository = getTypedRepository(db, 'UserUnitTable', UserUnitTable);

  console.log('🧠 DataSource from login:', db.options.database, '| hash:', db.entityMetadatas.map(m => m.name).join(','));

  try {

    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { login, pass } = req.body as RequestBody;

        // console.log('👀 userRepository:', usersRepository.target);
        //&&&&&
        const resUser = await getUser(login, pass, usersRepository)
        if (!resUser.success) {
          res.status(200).json({
            success: false,
            message: resUser.message,
          });
          return;
        }
        const user = resUser.user as UserItem;

        // &&&&&
        const resTeam = await getTeam(user.teamId, teamsRepository)
        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUser.message });
          return;
        }
        const team = resTeam.team;


        //  юзер получен проверяю актуальное соглашение
        const resAgreement = await getLastAgreement(user.id, userAgreeRepository, agreementRepository)
 
        if (!resAgreement.agreementId) {
          res.status(200).json({
            success: true,
            team: team,
            token: "",
            user: user,
            agreementText: "Нет соглашения",
            agreementId: "",
            signed: false,
            dateSigned: "",
            unit: undefined,            
          });
          return;
        }

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
          false,
          usersRepository,
          usersUnitsRepository,
          user.id)

        if (!resUserUnits_.success) {
          res.status(200).json({
            success: false,
            message: resUserUnits_.message,
          });
          ;
        }

        const userunit = resUserUnits_.userUnits.find((uu) => { return uu.userId === user.id; })

        const unit = (userunit && userunit.active) ? userunit.unit : undefined;

        // const unit = (resUserUnits_.userUnits.length > 0) ? resUserUnits_.userUnits[0].unit : undefined

        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
          token: accessToken,
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

