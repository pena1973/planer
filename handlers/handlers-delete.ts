
import { Repository, In, Any } from 'typeorm';
// tables
import { UserTable } from '@/db/models/catalogs/users';
import { SupportTable } from '@/db/models/support/support';

// types
import {UserItem, } from '@/types/types';



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

// Пользователи
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