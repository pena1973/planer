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

  const db = await connectDb();
  const usersRepository = getTypedRepository(db, 'UserTable', UserTable);  
  const usersUnitsRepository = getTypedRepository(db, 'UserUnitTable', UserUnitTable);

  try {
  
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {

      case 'GET':

        // userId, teamId в любом случае
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

        // const users_units_ = users_units.filter(u => (u.unit))
        // СПИСОК СООТВЕТСТВИЙ 
        const resUserUnits = await updateUsersUnits(
          Number(userId), 
          locale,
          usersUnitsRepository,
          users_units,
          teamId
        );
        if (!resUserUnits.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUserUnits.message });
          return;
        }

        const remainingUsers_ = resUserUnits.savedUsersUnits as UserUnitItem[];

        // отправляем ответ
        res.status(200).json({
          success: true,
          users_units: remainingUsers_,
          message: "",  // Сообщение об удалении
        });
        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (users-unit-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)