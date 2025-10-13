//pages/api/template-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../../lib/server/locale';

import { UserTable } from './../../../db/models/catalogs/users';
import { TeamTable } from './../../../db/models/catalogs/teams';
import { UserAgreeTable } from './../../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../../db/models/catalogs/agreements';
import { UserUnitTable } from './../../../db/models/catalogs/user_unit';
import { ActiveTimeTable } from './../../../db/models/billing/active_time';

import { UserItem } from './../../../types/types';
import { createAccessToken, createRefreshToken } from './../../../lib/common/auth'
import { getTypedRepository } from './../../../db/utilites'
import { getUser, getTeam, getLastAgreement } from './../../../handlers/handlers-auth';  // расчеты
import { getUsersUnits, getTeamActivity } from './../../../handlers/handlers-get';  // расчеты


interface RequestBody {
  login: string,
  pass: string,
  teamNumber: string,
  createTeam: boolean,
  nickname: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDb();

    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
    const agreementRepository = getTypedRepository(db, 'AgreementTable', AgreementTable);
    const usersUnitsRepository = getTypedRepository(db, 'UserUnitTable', UserUnitTable);
    const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);

    // console.log('🧠 DataSource from login:', db.options.database, '| hash:', db.entityMetadatas.map(m => m.name).join(','));

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { login, pass } = req.body as RequestBody;

        // console.log('👀 userRepository:', usersRepository.target);

        const resUser = await getUser(locale, login, pass, usersRepository)
        if (!resUser.success) {
          res.status(200).json({
            success: false,
            message: resUser.message,
          });
          break;
        }
        const user = resUser.user as UserItem;

        const resTeam = await getTeam(user.id, locale, user.teamId, teamsRepository)
        if (!resTeam.success) {
          res.status(200).json({
            success: false,
            message: resTeam.message,
          });
          break;
        }
        const team = resTeam.team;

        const resActiveTeam = await getTeamActivity(user.id, locale, [team], activeTimeRepository)
        const activeTeam = resActiveTeam.length > 0 ? resActiveTeam[0].active : false;
        //  юзер получен проверяю актуальное соглашение
        const resAgreement = await getLastAgreement(user.id, locale, userAgreeRepository, agreementRepository)

        if (!resAgreement.agreementId) {
          res.status(200).json({
            success: true,
            team: team,
            token: "",
            user: user,            
            agreementText: t('mes.noAgreement'),
            agreementId: "",
            signed: false,
            dateSigned: "",
            unit: undefined,
            activeTeam: activeTeam
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
        res.setHeader('Set-Cookie', [`refreshToken=${refreshToken}; HttpOnly; Path=/;  Max-Age=${60 * 60 * 24 * 7}`, // 7 дней
        ])

        //  получаю Юнит который занимает юзер
        //  получаем назначенные и получаем всех юзеров  и соединяем левым соединением

        const resUserUnits_ = await getUsersUnits(
          user.id, // для ошибок
          locale,
          team.id,
          false,
          usersRepository,
          usersUnitsRepository,
          user.id // для получения своего юнита  может и не указыватся когда получаем за всех юнитов команды
        )

        if (!resUserUnits_.success) {
          res.status(200).json({
            success: false,
            message: resUserUnits_.message,
          });
          ;
        }

        const userunit = resUserUnits_.userUnits.find((uu) => { return uu.userId === user.id; })
        const unit = (userunit && userunit.active) ? userunit.unit : undefined;

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
          activeTeam: activeTeam
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

