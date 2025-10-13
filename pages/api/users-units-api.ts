
//pages/api/users-units-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { UserTable } from './../../db/models/catalogs/users';
import { UserUnitTable } from './../../db/models/catalogs/user_unit';
import { UserUnitItem } from './../../types/types';
import { getUsersUnits } from './../../handlers/handlers-get';  // расчеты
import { updateUsersUnits } from './../../handlers/handlers-update';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  users_units: UserUnitItem[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
    const usersUnitsRepository = getTypedRepository(db, 'UserUnitTable', UserUnitTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {

      case 'GET':

        const { userId: userIdget, teamId: teamIdget, withoutAdmin } = req.query;

        //  получаем назначенные и получаем всех юзеров  и соединяем левым соединением
        const resUserUnits_ = await getUsersUnits(
          Number(userIdget),
          locale,
          Number(teamIdget),
          Boolean(withoutAdmin),
          usersRepository,
          usersUnitsRepository,
        )

        if (!resUserUnits_.success) {
          res.status(200).json({
            success: false,
            message: resUserUnits_.message,
          });
          break
          ;
        }
        res.status(200).json({
          success: true,
          users_units: resUserUnits_.userUnits,
          message: resUserUnits_.message,
        });

        break;

      case 'POST':
        const { users_units, userId, teamId } = req.body as RequestBody;

        const resUserUnits = await updateUsersUnits(
          Number(userId),
          locale,
          usersUnitsRepository,
          users_units,
          teamId
        );

        if (!resUserUnits.success) {
          res.status(200).json({
            success: false,
            message: resUserUnits.message
          });
          break;
        }

        const remainingUsersPost = resUserUnits.savedUsersUnits as UserUnitItem[];

        // отправляем ответ
        res.status(200).json({
          success: true,
          users_units: remainingUsersPost,
          message: "",
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
      location: "pages/api/users-units-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)