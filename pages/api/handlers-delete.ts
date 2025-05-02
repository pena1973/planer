
import { Repository, In, Any } from 'typeorm';
// tables
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TypeEnum } from '@/pages/db/models/enums';
import { ActionTable } from '@/pages/db/models/catalogs/actions';
import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { SettingsTable } from '@/pages/db/models/plan/settings';

import { UserTable } from '@/pages/db/models/catalogs/users';
import { UserUnitTable } from '@/pages/db/models/catalogs/user_unit';



// types
import {UserItem, UnitItem, UnitLoadItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem, TimeTypeEnum, DaysOfWeek, TimeZoneEnum, TCardOperationTermsItem } from '@/types';
import { TCardItem, TCardOperationItem, TCardProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem, TCardTermsItem } from '@/types';


// Пользователи
export async function deleteUsers(
  usersToDelete: UserItem[],  // Массив пользователей для удаления (только с id)
  usersRepository: Repository<UserTable>,  // Репозиторий пользователей
) {
  if (usersToDelete.length === 0) {
    return { success: false, message: 'Нет пользователей для удаления.' };
  }

  // Получаем только ids пользователей для удаления
  const userIds = usersToDelete.map(user => user.id);

  // Находим пользователей по их id
  const usersToDeleteEntities = await usersRepository.findByIds(userIds);

  if (usersToDeleteEntities.length === 0) {
    return { success: false, message: 'Пользователи не найдены в базе данных.' };
  }

  // Удаляем пользователей
  await usersRepository.remove(usersToDeleteEntities);

  return { success: true, message: 'Пользователи успешно удалены.' };
}