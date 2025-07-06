
import { Repository } from 'typeorm';
// tables
import { UserTable } from './../db/models/catalogs/users'
import { TeamTable } from './../db/models/catalogs/teams'
import { UserAgreeTable } from './../db/models/catalogs/user_agree';
import { AgreementTable } from './../db/models/catalogs/agreements';

// types
import { UserItem, TeamItem, } from './../types/types';

// хеш функция 
export const hashFoo = async (data: string) => {
  const { createHmac } = await import('node:crypto')
  const hash = createHmac('sha256', data)
    .digest('hex');
  return hash
}


export async function createNewTeam(
  teamsRepository: Repository<TeamTable>
): Promise<{ success: boolean, team: TeamItem, message?: string }> {

  // Создаем новый объект команды
  const team = new TeamTable();

  // Заполняем необходимые поля
  team.title = "New Team";  // Пример названия, можно заменить на реальные данные
  team.coment = "This is a new team.";  // Пример комментария
  team.prefix = "";  // Префикс будет сгенерирован в методе generatePrefixAndUniqueId

  // Сохраняем команду в базе данных
  try {
    // Сохраняем объект команды и вызываем хук для генерации уникальных данных
    const savedteam = await teamsRepository.save(team);

    // Возвращаем успешный результат с данными команды
    return {
      success: true,
      team: {
        id: savedteam.id,
        title: savedteam.title,
        coment: savedteam.coment,
        prefix: savedteam.prefix,
      },
      message: "Команда успешно создана",
    };
    // } catch (e: any) {
    //   // В случае ошибки возвращаем сообщение об ошибке
    //   return {
    //     success: false,
    //     team: {} as TeamItem,
    //     message: `Ошибка при создании команды: ${e.message}`,
    //   };
    // }
  } catch (e: unknown) {
    let message = "Ошибка при создании команды.";
    if (e instanceof Error) {
      message = `Ошибка при создании команды: ${e.message}`;
    }
    return {
      success: false,
      team: {} as TeamItem,
      message,
    };
  }

}

export async function createNewUser(
  login: string,
  pass: string,
  teamId: number,
  isAdmin: boolean,
  name: string,
  usersRepository: Repository<UserTable>,

): Promise<{ success: boolean, savedUser: UserItem, message?: string }> {

  const newUser = new UserTable();
  newUser.login = login;
  newUser.pass = await hashFoo(pass);
  newUser.isAdmin = isAdmin;
  newUser.name = name;
  newUser.team_id = teamId;
  newUser.locale = 'ru';

  const savedUser = await usersRepository.save(newUser);

  if (!savedUser) return {
    success: false,
    savedUser: {} as UserItem,
    message: `Ошибка при создании пользователя! `,
  };

  return {
    success: true,
    savedUser: {
      id: newUser.id,
      login: newUser.login,
      pass: newUser.pass,
      name: newUser.name,
      locale: newUser.locale,
      isAdmin: Boolean(newUser.isAdmin),
      teamId: newUser.team_id, // Добавляем teamId, если нужно
    },
    message: 'Пользователь успешно создан.',
  };

}

export async function updateUser(
  userId: number,
  oldpass: string | undefined,
  newpass: string | undefined,
  name: string | undefined,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, savedUser: UserItem, message?: string }> {

  try {
    // Ищем пользователя по ID
    const user = await usersRepository.findOne({ where: { id: userId } });

    // Если пользователь не найден
    if (!user) {
      return {
        success: false,
        savedUser: {} as UserItem,
        message: 'Пользователь не найден.',
      };
    }



    // Обновляем данные пользователя, если что-то передано
    if (name !== undefined) {
      user.name = name; // Обновляем никнейм
    }

    if (newpass !== undefined && oldpass !== undefined) {

      const hashOld = await hashFoo(oldpass)

      if (hashOld !== user.pass)
        return {
          success: false,
          savedUser: {} as UserItem,
          message: 'Не совпадает старый пароль',
        }
      const hashNew = await hashFoo(newpass)
      user.pass = hashNew; // Обновляем пароль
    }

    // Сохраняем обновленного пользователя
    const savedUser = await usersRepository.save(user);

    // Возвращаем результат
    return {
      success: true,
      savedUser: {
        id: savedUser.id,
        login: savedUser.login,
        pass: "",
        name: savedUser.name,
        locale: savedUser.locale,
        isAdmin: Boolean(savedUser.isAdmin),
        teamId: savedUser.team_id, 
      },
      message: 'Пользователь успешно обновлен.',
    };

    // } catch (e: any) {
    //   // Обработка ошибок
    //   return {
    //     success: false,
    //     savedUser: {} as UserItem,
    //     message: `Ошибка при обновлении пользователя: ${e.message}`,
    //   };
    // }
  } catch (e: unknown) {
    let message = "Ошибка при обновлении пользователя.";
    if (e instanceof Error) {
      message = `Ошибка при обновлении пользователя: ${e.message}`;
    }
    return {
      success: false,
      savedUser: {} as UserItem,
      message,
    };
  }

}


export async function getUser(
  login: string,
  pass: string,
  usersRepository: Repository<UserTable>
): Promise<{ success: boolean, user: UserItem, message?: string }> {

  // Строим фильтр для поиска пользователя по логину
  const filter = { login };

  // Ищем пользователя в базе данных
  const userRecord = await usersRepository.findOne({ where: filter });

  // Если пользователь не найден
  if (!userRecord) {
    return { success: false, user: {} as UserItem, message: 'Пользователь не найден' };
  }

  // Хешируем введенный пароль
  const hashedPassword = await hashFoo(pass);

  // Проверяем, совпадает ли хеш пароля
  if (hashedPassword !== userRecord.pass) {
    return { success: false, user: {} as UserItem, message: 'Неверный пароль' };
  }

  // Преобразуем данные из сущности в формат UserItem
  const user: UserItem = {
    id: userRecord.id,
    login: userRecord.login,
    pass: userRecord.pass, // Можно исключить, если не хотите передавать пароль
    name: userRecord.name, // Или другое поле, которое представляет собой никнейм
    locale: userRecord.locale,
    isAdmin: userRecord.isAdmin, // Конвертируем строку в булево значение
    teamId: userRecord.team_id, // Добавляем teamId, если нужно

  };

  // Возвращаем результат
  return { success: true, user, message: '' };
}


export async function isUserExist(
  login: string,
  usersRepository: Repository<UserTable>
): Promise<boolean> {

  // Строим фильтр для поиска пользователя по логину
  const filter = { login };

  // Ищем пользователя в базе данных
  const userRecord = await usersRepository.findOne({ where: filter });

  return !(!userRecord)

}

export async function getTeam(
  teamId: number,
  teamsRepository: Repository<TeamTable>
): Promise<{ success: boolean, team: TeamItem, message?: string }> {


  const team = await teamsRepository.findOne({ where: { id: teamId } });
  if (!team) {
    return {
      success: false,
      team: {} as TeamItem,
      message: 'Команда с таким номером не найдена.',
    };
  }

  // Возвращаем успешный результат с данными команды
  return {
    success: true,
    team: {
      id: team.id,
      title: team.title,
      coment: team.coment,
      prefix: team.prefix,
    },
    message: "Команда успешно найдена",
  };

}

export async function getLastAgreement(
  userId: number,
  userAgreeRepository: Repository<UserAgreeTable>,
  agreementRepository: Repository<AgreementTable>
): Promise<{ agreementText: string, agreementId: number | null, signed: boolean, dateSigned?: string, message?: string }> {

  const lastAgreements = await agreementRepository.find({
    order: { date: 'DESC' },  // Сортировка по дате в порядке убывания
    take: 1,  // Берем только одну запись (последнее соглашение)
  });

  // Если соглашение не найдено
  if (lastAgreements.length < 1) {
    return {
      agreementText: "",
      signed: false,
      agreementId: null,
      message: 'Не найдено ни одного соглашения.',
    };
  }
  const lastAgreement = lastAgreements[0];

  // Получаем информацию из таблицы user_agree о том, подписано ли соглашение данным пользователем
  const userAgree = await userAgreeRepository.findOne({
    where: { user_id: userId, agreement_id: lastAgreement.id },
  });


  // Если соглашение не найдено
  if (!userAgree) {
    return {
      agreementText: lastAgreement.text,
      signed: false,
      agreementId: lastAgreement.id,
      message: 'Не подписано.',
    };
  }

  // Проверяем, подписано ли соглашение
  const signed = userAgree ? userAgree.signed : false;
  const dateSigned = signed ? String(userAgree.date) : undefined;  // Если подписано, возвращаем дату

  // Возвращаем информацию о последнем соглашении
  return {
    agreementText: lastAgreement.text,  // Текст последнего соглашения
    signed,                    // Статус подписания
    agreementId: lastAgreement.id,
    dateSigned,                // Дата подписания (если подписано)
    message: 'Информация успешно получена.',
  };
}

export async function signAgreement(
  userId: number,
  signedAgreement: boolean,
  agreementId: number,
  userAgreeRepository: Repository<UserAgreeTable>
): Promise<{ success: boolean, signed: boolean, message?: string }> {


  // Проверяем, существует ли уже запись о подписании соглашения
  const userAgree = await userAgreeRepository.findOne({
    where: { user_id: userId, agreement_id: agreementId },
  });

  // Если запись существует, обновляем её
  if (userAgree) {
    userAgree.signed = signedAgreement;  // Обновляем статус подписания
    userAgree.date = signedAgreement ? new Date() : null; // Если подписано, обновляем дату

    // Сохраняем обновлённую запись
    await userAgreeRepository.save(userAgree);
    return {
      success: true,
      signed: signedAgreement,
      message: 'Соглашение успешно обновлено.',
    };
  } else if (signedAgreement) {

    // Создаём новую запись о подписании соглашения
    const newUserAgree = new UserAgreeTable();
    newUserAgree.user_id = userId;
    newUserAgree.agreement_id = agreementId;
    newUserAgree.signed = signedAgreement;
    newUserAgree.date = signedAgreement ? new Date() : null;  // Устанавливаем дату подписания, если подписано

    // Сохраняем новую запись
    await userAgreeRepository.save(newUserAgree);
    return {
      success: true,
      signed: signedAgreement,
      message: 'Соглашение успешно подписано.',
    };
  }

  return {
    success: false,
    signed: signedAgreement,
    message: 'Соглашение не менялось.',
  };
}
