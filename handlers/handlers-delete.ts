
import { DataSource, Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';

// tables
import { UserTable } from './../db/models/catalogs/users';
import { SupportTable } from './../db/models/support/support';
import { TeamTable } from "./../db/models/catalogs/teams";
import { UnitTable } from './../db/models/catalogs/units'
import { UnitActionTable } from './../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../db/models/plan/unit_loads';
import { TCardTable } from './../db/models/data/t_cards'
import { TCardStageTable } from './../db/models/data/t_card_stages'
import { TemplateTable } from './../db/models/catalogs/templates'
import { UserAgreeTable } from './../db/models/catalogs/user_agree';

import { ProductTable } from './../db/models/data/products'
import { TCardProductTable } from './../db/models/data/t_card_products'
import { TCardOperationTable } from './../db/models/data/t_card_operations'

import { ActionTable } from './../db/models/catalogs/actions';
import { UOMsTable } from './../db/models/catalogs/uoms';
import { UnitExceptionTable } from './../db/models/plan/unit_exceptions';
import { SettingsTable } from './../db/models/plan/settings';
import { UserUnitTable } from './../db/models/catalogs/user_unit';

// types
import { UserItem, } from './../types/types';



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



export async function deleteUser(
  userId: number,
  usersRepository: Repository<UserTable>
): Promise<{ success: boolean; message: string }> {
  if (!Number.isFinite(userId)) {
    return { success: false, message: 'Пользователь для удаления не указан или неверный id.' };
  }

  try {
    const userToDelete = await usersRepository.findOne({
      where: { id: userId },
    });

    if (!userToDelete) {
      return { success: false, message: `Пользователь с id=${userId} не найден.` };
    }

    const deleteResult = await usersRepository.delete({ id: userId });

    if ((deleteResult.affected ?? 0) === 0) {
      return { success: false, message: `Не удалось удалить пользователя с id=${userId}.` };
    }

    return { success: true, message: `Пользователь с id=${userId} успешно удалён.` };
  } catch (err) {
    console.error("Ошибка при удалении пользователя:", err);
    return { success: false, message: `Ошибка удаления: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// 
export async function deleteSupport(
  idsToDelete: number[],  // Массив сообщений
  supportRepository: Repository<SupportTable>,
) {
  if (idsToDelete.length === 0) {
    return { success: false, message: 'Нет сообщений для удаления.' };
  }


  // Находим пользователей по их id
  const mesToDeleteEntities = await supportRepository.findByIds(idsToDelete);

  if (mesToDeleteEntities.length === 0) {
    return { success: false, message: 'Сообщения не найдены в базе данных.' };
  }

  // Удаляем пользователей
  await supportRepository.remove(mesToDeleteEntities);

  return { success: true, message: 'Сообщения успешно удалены.' };
}

// ОПАСНАЯ ОПЕРАЦИЯ !!!!!


// export async function deleteDataTeam(
//   teamId: number,
//   teamRepository: Repository<TeamTable>,
//   unitLoadsRepository: Repository<UnitLoadTable>,
//   templateRepository: Repository<TemplateTable>,
//   tCardOperationRepository: Repository<TCardOperationTable>,
//   tCardStageRepository: Repository<TCardStageTable>,
//   tCardProductRepository: Repository<TCardProductTable>,
//   productRepository: Repository<ProductTable>,
//   tCardRepository: Repository<TCardTable>,
//   userUnitRepository: Repository<UserUnitTable>,
//   unitActionRepository: Repository<UnitActionTable>,
//   unitExceptionsRepository: Repository<UnitExceptionTable>,
//   unitRepository: Repository<UnitTable>,
//   settingsRepository: Repository<SettingsTable>,
//   actionRepository: Repository<ActionTable>,
//   uomsRepository: Repository<UOMsTable>,

// ): Promise<{ success: boolean; message: string }> {
//   if (!Number.isFinite(teamId)) {
//     return { success: false, message: 'Команда для удаления не указана.' };
//   }

//   try {
//     const teamToUpdate = await teamRepository.findOne({
//       where: { id: teamId }
//     });
//     if (!teamToUpdate) {
//       throw new Error(`Команда с id=${teamId} не найдена`);
//     }
//     // Проставляем active = false
//     teamToUpdate.active = false;
//     // Сохраняем обновлённую команду
//     const updatedTeam = await teamRepository.save(teamToUpdate);

//     // Удаляем последовательно
//     const load_result = await unitLoadsRepository.delete({ team_id: teamId });
//     const template_result = await templateRepository.delete({ team_id: teamId });
//     const tCardOper_result = await tCardOperationRepository.delete({ team_id: teamId });

//     const tCardStage_result = await tCardStageRepository.delete({ team_id: teamId });
//     const tCardProduct_result = await tCardProductRepository.delete({ team_id: teamId });
//     const product_result = await productRepository.delete({ team_id: teamId });


//     const tCard_result = await tCardRepository.delete({ team_id: teamId });
//     const userUnit_result = await userUnitRepository.delete({ team_id: teamId });
//     const unitAction_result = await unitActionRepository.delete({ team_id: teamId });
//     const unitException_result = await unitExceptionsRepository.delete({ team_id: teamId });


//     const unit_result = await unitRepository.delete({ team_id: teamId });
//     const setting_result = await settingsRepository.delete({ team_id: teamId });
//     const action_result = await actionRepository.delete({ team_id: teamId });
//     const uoms_result = await uomsRepository.delete({ team_id: teamId });

    
//     return { success: true, message: 'Данные команды успешно удалены.' };
//   } catch (err) {    
//     console.error('Ошибка при удалении данных команды:', err);
//     return { success: false, message: `Ошибка удаления: ${err instanceof Error ? err.message : String(err)}` };
//   } 
// }

export async function deleteDataTeam(
  teamId: number,
  teamRepository: Repository<TeamTable>,
  repositories: {
    unitLoads: Repository<UnitLoadTable>,
    templates: Repository<TemplateTable>,
    tCardOperations: Repository<TCardOperationTable>,
    tCardStages: Repository<TCardStageTable>,
    tCardProducts: Repository<TCardProductTable>,
    products: Repository<ProductTable>,
    tCards: Repository<TCardTable>,
    userUnits: Repository<UserUnitTable>,
    unitActions: Repository<UnitActionTable>,
    unitExceptions: Repository<UnitExceptionTable>,
    units: Repository<UnitTable>,
    settings: Repository<SettingsTable>,
    actions: Repository<ActionTable>,
    uoms: Repository<UOMsTable>
  }
): Promise<{ success: boolean; message: string }> {
  if (!Number.isFinite(teamId)) {
    return { success: false, message: 'Команда для удаления не указана.' };
  }

  try {
    // Проверка команды
    const teamToUpdate = await teamRepository.findOne({ where: { id: teamId } });
    if (!teamToUpdate) {
      throw new Error(`Команда с id=${teamId} не найдена`);
    }

    // Деактивация команды
    teamToUpdate.active = false;
    await teamRepository.save(teamToUpdate);

    // Список всех репозиториев с подписью
    const repoList: [string, Repository<any>][] = [
      ['UnitLoads', repositories.unitLoads],
      ['Templates', repositories.templates],
      ['TCardOperations', repositories.tCardOperations],
      ['TCardStages', repositories.tCardStages],
      ['TCardProducts', repositories.tCardProducts],
      ['Products', repositories.products],
      ['TCards', repositories.tCards],
      ['UserUnits', repositories.userUnits],
      ['UnitActions', repositories.unitActions],
      ['UnitExceptions', repositories.unitExceptions],
      ['Units', repositories.units],
      ['Settings', repositories.settings],
      ['Actions', repositories.actions],
      ['UOMs', repositories.uoms],
    ];

    let totalDeleted = 0;

    for (const [label, repo] of repoList) {
      const result = await repo.delete({ team_id: teamId });
      const affected = result.affected ?? 0;
      totalDeleted += affected;

      if (affected > 0) {
        console.log(`✅ ${label}: удалено ${affected} записей`);
      } else {
        console.warn(`⚠️ ${label}: ничего не удалено`);
      }
    }

    return {
      success: true,
      message: `Удаление завершено. Всего затронуто ${totalDeleted} записей`
    };
  } catch (err) {
    console.error('Ошибка при удалении данных команды:', err);
    return { success: false, message: `Ошибка удаления: ${err instanceof Error ? err.message : String(err)}` };
  }
}
