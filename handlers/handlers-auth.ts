//handlers/handlers-auth
import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { Repository } from 'typeorm';
// tables
import { UserTable } from './../db/models/catalogs/users'
import { TeamTable } from './../db/models/catalogs/teams'
import { UserAgreeTable } from './../db/models/catalogs/user_agree';
import { AgreementTable } from './../db/models/catalogs/agreements';
import { ActiveTimeTable } from './../db/models/billing/active_time'
import { VerificationCodeTable } from './../db/models/auth/verification_code';
import { SettingsTable } from './../db/models/plan/settings'
import { TeamScheduleTable } from './../db/models/plan/team_schedule'

// types
import { UserItem, TeamItem, SettingsItem, TimeZoneEnum, DaysOfWeek, ScheduleItem, } from './../types/types';
import { generateTeamNumber } from '@/lib/common/utils';
import { checkCode } from './../lib/server/code';


// хеш функция — без import('crypto')
export const hashFoo = async (data: string) => {
  const req = eval('require') as NodeJS.Require;              // <-- ключевой трюк
  const { createHmac } = req('crypto') as typeof import('crypto');

  const hash = createHmac('sha256', data)
    .update(data)
    .digest('hex');

  return hash;
};

import { getCurrentDateInString, } from "@/lib/common/timezone"


//! получение пользователя по ID
export async function getUserById(
  userId: number, // кто запрашивает
  userFindId: number, // кого запрашивает
  locale: string,
  usersRepository: Repository<UserTable>,
): Promise< UserItem|undefined> {

  const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'
  try {
    // Шаг 1: Получаем всех пользователей команды
    const usertab = await usersRepository.findOne({ where: { id: userFindId } });

    if (!usertab) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "handlers/handlers-get/getUsers",
        event: "error",
        message: `При запросе юзера - он не найдены 'id: ${userFindId}`,
        context: "export async function getUser(",
      }).catch(() => { console.error("logger error") });
    }

    // Если пользователь не найден
    if (!usertab) {
      return undefined;
    }

    const user = {
      id: usertab.id,
      login: "",
      pass: "",
      name: usertab.name,
      locale: usertab.locale,
      isAdmin: usertab.isAdmin,
      active: usertab.active,
    } as UserItem;

    return user;

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getUsers",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUsers(",
    }).catch(() => { console.error("logger error") });
    return undefined;
  }
}


export async function createNewTeam(
  userId: number | null, // может быть null когда создается команда а юзер еще не создан
  locale: string,
  teamsRepository: Repository<TeamTable>,
  activeTimeRepository: Repository<ActiveTimeTable>,
  settingsRepository: Repository<SettingsTable>,
  teamScheduleRepository: Repository<TeamScheduleTable>,
  timezone: TimeZoneEnum,
  main_team: string | null
): Promise<{
  success: boolean,
  team: TeamItem,
  message?: string
}> {


  // Сохраняем команду в базе данных
  try {
    // Сохраняем объект команды и вызываем хук для генерации уникальных данных
    // const savedteam_ = await teamsRepository.save(team);

    const team = teamsRepository.create({
      title: "New Team",
      coment: "This is a new team.",
      prefix: "",           // хук заполнит      
      main_team: ""         // временно пусто
    });

    // 2) первый save -> сработает @BeforeInsert и заполнит prefix
    const savedteam_ = await teamsRepository.save(team);

    if (savedteam_) {
      savedteam_.main_team = (main_team) ? main_team : generateTeamNumber(savedteam_.prefix, savedteam_.id)
    }
    const savedteam = await teamsRepository.save(savedteam_);
    // Возвращаем успешный результат с данными команды
    const dateStr = getCurrentDateInString(timezone);

    // сохраним время активацими команды
    const active_time = activeTimeRepository.create({
      date: dateStr,
      direction: "start",
      team_id: savedteam_.id
    });
    const savedactive_time = await activeTimeRepository.save(active_time);

    // сохраним таймзону и расписание команды (предустановка)
    const newSchedule = teamScheduleRepository.create({
      timeStartWork: 540,
      timeFinishWork: 1080,
      breaks: [{ timeStart: 780, timeFinish: 840 }],
      holidays: [],
      weekends: [DaysOfWeek.SATURDAY, DaysOfWeek.SUNDAY],
      workdays: [],
      team_id: team.id,
      timeZone: timezone,
    });
    const saveTeamSchedule = await teamScheduleRepository.save(newSchedule);

    // сохраним начальные настройки команды (предустановка)
    const newSettings = settingsRepository.create({
      team_id: team.id,
      timeStartWork: 480,
      timeFinishWork: 1140,
      showWeekend: false,
      showHoliday: false,
      isQualControl: true,
    });
    const savedNewSettings = await settingsRepository.save(newSettings);


    return {
      success: true,
      team: {
        id: savedteam.id,
        title: savedteam.title,
        coment: savedteam.coment,
        prefix: savedteam.prefix,
        main_team: savedteam.main_team,
      },
      message: "Команда успешно создана",
    };



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
  locale: string,
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
// &&&&& проверяет код при подтверждении мейла либо восстаенволении пароля
export async function verifyCode(
  locale: string,
  email: string,
  code: string,
  purpose: string,
  verificationCodeRepository: Repository<VerificationCodeTable>,
): Promise<{ success: boolean, reason?: string }> {

  try {
    const rec = await verificationCodeRepository.createQueryBuilder('v')
      .where('v.email = :email', { email })
      .andWhere('v.purpose = :purpose', { purpose })
      .andWhere('v.used = false')
      .orderBy('v.created_at', 'DESC')
      .getOne();

    const now = new Date();
    if (!rec || rec.expires_at < now || rec.attempts >= rec.max_attempts) {
      if (rec && rec.expires_at < now) { rec.used = true; await verificationCodeRepository.save(rec); }
      return { success: false, reason: 'invalid_or_expired' };
    }

    const ok = await checkCode(code, rec.code_hash);
    if (!ok) {
      rec.attempts += 1; await verificationCodeRepository.save(rec);
      return { success: false, reason: 'invalid_or_expired' };
    }

    rec.used = true;
    await verificationCodeRepository.save(rec);

  } catch (e: unknown) {
    let message = "Ошибка при обновлении пользователя.";
    if (e instanceof Error) {
      message = `Ошибка при обновлении пользователя: ${e.message}`;
      return { success: false, reason: message };
    }
  }
  return { success: true }
}
export async function confirmUserEmail(
  locale: string,
  email: string,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, message?: string }> {

  try {
    // Ищем пользователя по ID
    const user = await usersRepository.findOne({ where: { login: email } });

    // Если пользователь не найден
    if (!user) {
      return {
        success: false,
        message: 'Пользователь не найден.',
      };
    }

    user.confirmed = true; // подтверждаем е мейл
    // Сохраняем обновленного пользователя
    const savedUser = await usersRepository.save(user);

    // Возвращаем результат
    return {
      success: true,

      message: 'Пользователь успешно обновлен.',
    };
  } catch (e: unknown) {
    let message = "Ошибка при обновлении пользователя.";
    if (e instanceof Error) {
      message = `Ошибка при обновлении пользователя: ${e.message}`;
    }
    return {
      success: false,

      message,
    };
  }

}

export async function resetUserPass(
  locale: string,
  login: string,
  pass: string,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, savedUser: UserItem, message?: string }> {

  try {
    // Ищем пользователя по ID
    const user = await usersRepository.findOne({ where: { login: login } });

    // Если пользователь не найден
    if (!user) {
      return {
        success: false,
        savedUser: {} as UserItem,
        message: 'Пользователь не найден.',
      };
    }

    if (!pass) {
      return {
        success: false,
        savedUser: {} as UserItem,
        message: 'Пароль не задан.',
      };
    }
    const hashNew = await hashFoo(pass)
    user.pass = hashNew; // Обновляем пароль

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
        confirmed: Boolean(savedUser.confirmed),
        isSystem: Boolean(savedUser.isSystem),
      },
      message: 'Пользователь успешно обновлен.',
    };
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
//!  Обновление пользователя
export async function updateUser(
  userId: number,
  locale: string,
  oldpass: string | undefined,
  newpass: string | undefined,
  name: string | undefined,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, savedUser?: UserItem, message?: string }> {
  
  const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'
  
  try {
    // Ищем пользователя по ID
    // const user = await usersRepository.findOne({ where: { id: userId } });
    const user = await getUserById(userId, userId, locale, usersRepository);
    // Если пользователь не найден
    if (!user) {
      return {
        success: false,
        message: t('mes.noUser'),
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
          // message: 'Не совпадает старый пароль',
          message: t('mes.passNotTheSame'),
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
        confirmed: Boolean(savedUser.confirmed),
        isSystem: Boolean(savedUser.isSystem),
      },
      // message: 'Пользователь успешно обновлен.',
      message: t('mes.userUpdated'),
    };
   } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');
    
    void ulogger.error({
      userId,
      location: "handlers/handlers-auth/updateUser",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateUser",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: '+ msg };
  }

}

// &&&&&
export async function getUser(
  locale: string,
  login: string,
  pass: string,
  usersRepository: Repository<UserTable>
): Promise<{ success: boolean, user: UserItem, message?: string }> {

  // Строим фильтр для поиска пользователя по логину
  const filter = { login };
  // console.log('💡 Репозиторий user:', usersRepository.metadata.name);
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

    confirmed: Boolean(userRecord.confirmed),
    isSystem: Boolean(userRecord.isSystem),
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

//&&&&&&
export async function getTeam(
  userId: number | null,
  locale: string,
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


  return {
    success: true,
    team: {
      id: team.id,
      title: team.title,
      coment: team.coment,
      prefix: team.prefix,
      main_team: team.main_team,
    },
    message: "Команда успешно найдена",
  };

}

// &&&&&
export async function getLastAgreement(
  userId: number,
  locale: string,
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


//! Подпимсание соглашения
export async function signAgreement(
  userId: number,
  locale: string,
  signedAgreement: boolean,
  agreementId: number,
  userAgreeRepository: Repository<UserAgreeTable>
): Promise<{ success: boolean; signed: boolean; message?: string }> {
  const t = getServerT(locale, 'sermes');

  try {
    const userAgree = await userAgreeRepository.findOne({
      where: { user_id: userId, agreement_id: agreementId },
    });

    // Ничего не меняем — ничего не пишем
    if (userAgree && userAgree.signed === signedAgreement) {
      return { success: true, signed: userAgree.signed, message: t('mes.agreementNotChanged') };
    }

    if (userAgree && signedAgreement) {
      userAgree.signed = signedAgreement;
      userAgree.date = signedAgreement ? new Date() : null;
      await userAgreeRepository.save(userAgree, { reload: false });
      return { success: true, signed: signedAgreement, message: t('mes.agreementUpdated') };
    }

    // новый
    if (!userAgree && signedAgreement) {
      const newUserAgree = userAgreeRepository.create({
        user_id: userId,
        agreement_id: agreementId,
        signed: true,
        date: new Date(),
      });
      await userAgreeRepository.save(newUserAgree, { reload: false });
      return { success: true, signed: true, message: t('mes.agreementUpdated') };
    }

    // Нет записи и приходит false — логично просто вернуть "ничего не меняли"
    return { success: true, signed: false, message: t('mes.agreementNotChanged') };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');
    void ulogger.error({
      userId,
      location: "handlers/handlers-auth/signAgreement",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "signAgreement",
    }).catch(() => { console.error("logger error"); });

    return { success: false, signed: signedAgreement, message: 'db_error: ' + msg };
  }
}
