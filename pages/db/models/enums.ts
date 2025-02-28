// Определение перечисления
export enum TypeEnum {
  P = 'P',
  W = 'W',
  M = 'M',
  I = 'I',
  O = 'O',
}
// Статусы операций  и карт
export enum StatusEnum {
  Dr = 'draft',
  Pr = 'prepared',
  Pl = 'planed',
  Cm = 'completed',
  Cn = 'cancelled',
  Fl = 'faulty', // бракован
}

// роли
export enum RoleEnum {
  Dr = 'Operator',
  Rd = 'Planer',
  Pl = 'Unit',
  
}
// хранить обрабатывать
export enum UnitTypeEnum {
  K = 'Keep',
  P = 'Process',  
}
// свой чужой
export enum UnitBelongEnum {
  I = 'inner',  
  O = 'outer',
}


// описание отклонений работы юнита
export enum TimeTypeEnum {
  W = 'work',
  N = 'not work',
  B = 'breack',
}
export enum DaysOfWeek {
   
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY"
}

export enum TimeZoneEnum {
  // UTC 0
  "Europe/Lisbon" = "Europe/Lisbon, UTC+0", // Лиссабон
  "Europe/Dublin" = "Europe/Dublin, UTC+0", // Дублин

  // UTC +1
  "Europe/Paris" = "Europe/Paris, UTC+1", // Париж
  "Europe/Berlin" = "Europe/Berlin, UTC+1", // Берлин
  "Europe/Madrid" = "Europe/Madrid, UTC+1", // Мадрид
  "Europe/Rome" = "Europe/Rome, UTC+1", // Рим
  "Europe/Amsterdam" = "Europe/Amsterdam, UTC+1", // Амстердам
  "Europe/Brussels" = "Europe/Brussels, UTC+1", // Брюссель
  "Europe/Oslo" = "Europe/Oslo, UTC+1", // Осло
  "Europe/Copenhagen" = "Europe/Copenhagen, UTC+1", // Копенгаген
  "Europe/Stockholm" = "Europe/Stockholm, UTC+1", // Стокгольм
  "Europe/Vienna" = "Europe/Vienna, UTC+1", // Вена
  "Europe/Prague" = "Europe/Prague, UTC+1", // Прага
  "Europe/Zurich" = "Europe/Zurich, UTC+1", // Цюрих
  "Europe/Luxembourg" = "Europe/Luxembourg, UTC+1", // Люксембург

  // UTC +2
  "Europe/Helsinki" = "Europe/Helsinki, UTC+2", // Хельсинки
  "Europe/Sofia" = "Europe/Sofia, UTC+2", // София
  "Europe/Bucharest" = "Europe/Bucharest, UTC+2", // Бухарест  
  "Europe/Riga" = "Europe/Riga, UTC+2", // Бухарест  

  // Россия
  "Europe/Kaliningrad" = "Europe/Kaliningrad, UTC+2", // Калининград
  "Europe/Moscow" = "Europe/Moscow, UTC+3", // Москва
  "Europe/Volgograd" = "Europe/Volgograd, UTC+4", // Волгоград
  "Europe/Yekaterinburg" = "Europe/Yekaterinburg, UTC+5", // Екатеринбург
  "Europe/Omsk" = "Europe/Omsk, UTC+6", // Омск
  "Europe/Krasnoyarsk" = "Europe/Krasnoyarsk, UTC+7", // Красноярск
  "Europe/Irkutsk" = "Europe/Irkutsk, UTC+8", // Иркутск
  "Europe/Chita" = "Europe/Chita, UTC+9", // Чита
  "Europe/Vladivostok" = "Europe/Vladivostok, UTC+10", // Владивосток
  "Europe/Magadan" = "Europe/Magadan, UTC+11", // Магадан
  "Europe/Kamchatka" = "Europe/Kamchatka, UTC+12", // Камчатка
  
  // Казахстан
  "Asia/Almaty" = "Asia/Almaty, UTC+6", // Алматы
  "Asia/Aqtobe" = "Asia/Aqtobe, UTC+5", // Актобе
  "Asia/Atyrau" = "Asia/Atyrau, UTC+5", // Атырау
  "Asia/Qyzylorda" = "Asia/Qyzylorda, UTC+6", // Кызылорда
  "Asia/Shymkent" = "Asia/Shymkent, UTC+6", // Шымкент
  "Asia/Oskemen" = "Asia/Oskemen, UTC+6", // Усть-Каменогорск
  "Asia/Pavlodar" = "Asia/Pavlodar, UTC+6", // Павлодар
  "Asia/Karaganda" = "Asia/Karaganda, UTC+6", // Караганда
}
  