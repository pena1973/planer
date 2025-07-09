import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utils'

import { UserTable } from './../../db/models/catalogs/users';
import { TeamTable } from './../../db/models/catalogs/teams';
import { UserUnitTable } from './../../db/models/catalogs/user_unit';
import { UserUnitItem, UserItem } from './../../types/types';
import { getUsersUnits, getUsers } from './../../handlers/handlers-get';  // расчеты
import { updateUsersUnits, updateUsers } from './../../handlers/handlers-update';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  users_units: UserUnitItem[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

const db = await connectDb();
  const usersRepository = getTypedRepository(db, 'UOMsTable', UserTable);
  const teamsRepository = getTypedRepository(db, 'UOMsTable', TeamTable);
  const usersUnitsRepository = getTypedRepository(db, 'UOMsTable', UserUnitTable);

  try {
 
    switch (req.method) {

      case 'GET':

        // userId, teamId в любом случае
        const { userId: getUserId, teamId: getTeamId } = req.query;

        //  получаем назначенные и получаем всех юзеров  и соединяем левым соединением
        const resUserUnits_ = await getUsersUnits(
          Number(getTeamId),
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

        // СПИСОК СООТВЕТСТВИЙ 
        const resUserUnits = await updateUsersUnits(
          usersUnitsRepository,
          users_units,
          teamId
        );
        if (!resUserUnits.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUserUnits.message });
          return;
        }

        const savedUsersUnits = resUserUnits.savedUsersUnits as UserUnitTable[];

        // Получаем всех пользователей для данной команды
        const resUsers = await getUsers(teamId, usersRepository);

        if (!resUsers.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUsers.message });
          return;
        }

        // Все текущие юзеры
        const users = resUsers.users as UserItem[];

        // Фильтруем пользователей, которых нет в списке userUnits и исключаем пользователей с isAdmin === true
        const usersToUnactive = users.filter(user =>
          !savedUsersUnits.some(saved => saved.user_id === user.id) && user.isAdmin == false
        );

        // Преобразуем пользователей в массив объектов с active = false
        const usersToUnactive_ = usersToUnactive.map(user => {return{...user, active: false}});
        
        // let message = '';
        // let remainingUsers: UserUnitTable[] = [];

        // Делаем удаленных юзеров неактивными
        if (usersToUnactive_.length > 0) {
          const resUsersDel = await updateUsers(usersRepository, usersToUnactive_, teamId)

          if (!resUsersDel.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUsersDel.message });
            return;
          }

          // const savedUsersUnits = resUsersDel.savedUsers as UserTable[];
          // неактивных никуда не передаем, просто помечаем их как неактивные
        }
        // Преобразуем оставшихся пользователей в необходимый формат для ответа
        const remainingUsers_ = savedUsersUnits
          .map(u => ({
            id: u.id,
            userId: u.user_id,
            name: u.user?.name,
            unit: u.unit,
            active: u.active,
            unitId: u.unit_id,
          } as UserUnitItem));

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