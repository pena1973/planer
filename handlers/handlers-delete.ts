
import { DataSource, Repository, ObjectLiteral, FindOptionsWhere, In, LessThan } from 'typeorm';

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
import { TeamScheduleTable } from './../db/models/plan/team_schedule';
import { UserUnitTable } from './../db/models/catalogs/user_unit';
import { ActiveTimeTable } from './../db/models/billing/active_time';
// types
import { UserItem, } from './../types/types';

import { changeStateTeambyId } from './../handlers/handlers-update';  // расчеты

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
export async function deleteDataTeam(
  teamId: number,
  timezone: string,
  teamRepository: Repository<TeamTable>,
  activeTimeRepository: Repository<ActiveTimeTable>,
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
    teamSchedule: Repository<TeamScheduleTable>
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

    // // Деактивация команды
    // изменение состояния активности команды
    const resTeam = await changeStateTeambyId(activeTimeRepository, Number(teamId), false, timezone)

    if (!resTeam.success) {
      console.warn('Не удалось деактивировать команду перед удалением:', resTeam.message);

    }
    // teamToUpdate.active = false;
    // await teamRepository.save(teamToUpdate);

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
      ['TeamSchedule', repositories.teamSchedule],
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

export async function deleteDataOlder90(
  unitLoads: Repository<UnitLoadTable>,
  tCardOperations: Repository<TCardOperationTable>,
  tCardStages: Repository<TCardStageTable>,
  tCardProducts: Repository<TCardProductTable>,
  products: Repository<ProductTable>,
  tCards: Repository<TCardTable>,

) {

  function getDateNDaysAgo(days: number): string {
    const now = new Date();
    now.setDate(now.getDate() - days);
    return now.toISOString().slice(0, 10); // yyyy-mm-dd
  }  
  const cutoff = getDateNDaysAgo(90);
  // удаляем лоады старше 90 дней
  const result = await unitLoads.delete({
    date: LessThan(cutoff),
  });

  //  выбираем все карты старше 90
  const cards = await tCards.find({
    where: { date: LessThan(cutoff) },
  });

  const tCardIds = cards.map(card => card.id)
  // определим только те карты по которым не осталось лоадов и которые старше 90 дней 

  // 3) Проверяем, по каким картам остались лоады (после удаления старых)
  const loadsRemain = await unitLoads.find({ where: { id_tCard: In(tCardIds) } });
  const tCardIdsWithLoads = new Set(loadsRemain.map(l => l.id_tCard));

  // 4) Карты, по которым лоадов НЕ осталось → их можно удалять (и связанные записи)
  const cardsToDelete = cards.filter(c => !tCardIdsWithLoads.has(c.id));
  if (cardsToDelete.length === 0) {
    return;
  }
  const idsToDelete = cardsToDelete.map(c => c.id);

  // 5) Удаляем связанные записи в правильном порядке
  const prodDel = await tCardProducts.delete({ tcard_id: In(idsToDelete) });
  const opsDel = await tCardOperations.delete({ tcard_id: In(idsToDelete) });
  const stagesDel = await tCardStages.delete({ tcard_id: In(idsToDelete) });  
  const prodMasterDel = await products.delete({ tcard_id: In(idsToDelete) });
  // 6) Удаляем сами карты
  const cardsDel = await tCards.delete(idsToDelete);

}