import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/translate/locale';
import { getTypedRepository } from './../../db/utilites'

import { UserTable } from './../../db/models/catalogs/users';

import { TeamTable } from "./../../db/models/catalogs/teams";
import { UnitTable } from './../../db/models/catalogs/units'
import { UnitActionTable } from './../../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../../db/models/plan/unit_loads';
import { TCardTable } from './../../db/models/data/t_cards'
import { TCardStageTable } from './../../db/models/data/t_card_stages'
import { TemplateTable } from './../../db/models/catalogs/templates'
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';

import { ProductTable } from './../../db/models/data/products'
import { TCardProductTable } from './../../db/models/data/t_card_products'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'

import { ActionTable } from './../../db/models/catalogs/actions';
import { UOMsTable } from './../../db/models/catalogs/uoms';
import { UnitExceptionTable } from './../../db/models/plan/unit_exceptions';
import { SettingsTable } from './../../db/models/plan/settings';
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { UserUnitTable } from './../../db/models/catalogs/user_unit';
import { ActiveTimeTable } from './../../db/models/billing/active_time';

import { UserItem } from './../../types/types';
import { updateUser } from './../../handlers/handlers-auth';  // расчеты

import { deleteDataTeam, deleteUser } from './../../handlers/handlers-delete';
import { getTeamShedule } from '@/handlers/handlers-get';


interface RequestBody {
  userId: number,
  teamId: number,
  oldpass: string,
  newpass: string,
  name: string,
  isAdmin: boolean,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();

  const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const unitsRepository = getTypedRepository(db, 'UnitTable', UnitTable);
  const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
  const unitLoadsRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const tCardsRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardStagesRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
  const templatesRepository = getTypedRepository(db, 'TemplateTable', TemplateTable);
  const productsRepository = getTypedRepository(db, 'ProductTable', ProductTable);
  const tCardProductsRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const actionsRepository = getTypedRepository(db, 'ActionTable', ActionTable);
  const uomsRepository = getTypedRepository(db, 'UOMsTable', UOMsTable);
  const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);
  const settingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);
  const userUnitRepository = getTypedRepository(db, 'UserUnitTable', UserUnitTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);


  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const { teamId, userId, oldpass, newpass, name, isAdmin } = req.body as RequestBody;

    switch (req.method) {
      // регистрируем пользователя
      case 'POST':

        const resUpdUser = await updateUser(
          userId,
          locale,
          oldpass,
          newpass,
          name,
          usersRepository);

        if (!resUpdUser.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUpdUser.message });
          return;
        }

        const user = resUpdUser.savedUser as UserItem;
        // отправляем ответ
        res.status(200).json({
          success: true,
          user: user,

        });
        break;
      case 'DELETE':
        // удаляем пользователя        
        if (typeof userId !== 'number' || Number.isNaN(userId)) {
          res.status(400).json({ error: 'userId обязателен и должен быть числом' });
          return;
        }

        // если админ — сначала чистим данные команды
        if (isAdmin) {
          if (typeof teamId !== 'number' || Number.isNaN(teamId)) {
            res.status(400).json({ error: 'teamId обязателен для админа и должен быть числом' });
            return;
          }

          // запросим расписание компании чтобы взять timezone
          const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

          if (!shedule_) {
            res.status(200).json({
              success: false,
              message: "Ошибка, не найдено расписание команды",
            });
            break;
          }
          const resTeam = await deleteDataTeam(
            Number(userId),
            locale,
            Number(teamId),
            shedule_.timeZone,
            teamsRepository,
            activeTimeRepository,
            {
              unitLoads: unitLoadsRepository,
              templates: templatesRepository,
              tCardOperations: tCardOperationsRepository,
              tCardStages: tCardStagesRepository,
              tCardProducts: tCardProductsRepository,
              products: productsRepository,
              tCards: tCardsRepository,
              userUnits: userUnitRepository,
              unitActions: unitActionsRepository,
              unitExceptions: unitExceptionsRepository,
              units: unitsRepository,
              settings: settingsRepository,
              actions: actionsRepository,
              uoms: uomsRepository,
              teamSchedule: teamScheduleRepository,

            }
          );

          if (!resTeam.success) {
            res.status(500).json({ error: 'Не удалось удалить данные команды: ' + resTeam.message });
            return;
          }
        }
        // затем удаляем пользователя
        const resUser = await deleteUser(Number(userId), locale, usersRepository);

        if (!resUser.success) {
          res.status(500).json({ error: 'Не удалось удалить пользователя: ' + resUser.message });
          return;
        }

        res.status(200).json({ success: true });

        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (profile-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
export default withAuth(handler)

