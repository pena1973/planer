export interface TCardStageItem {
    id?: number,  // id BD
    idc: number, //  id на клиенте
    code: number,
}

export interface TCardOperationItem {
    id?: number,  // id BD
    idc: number, //  id на клиенте
    stage: TCardStageItem,
    out: TCardProductItem[],
    inn: TCardProductItem[],
    action: ActionItem,
    duration: number, // в милисекундах   
    mode?: boolean // для целей редактирования на форме
    status:StatusEnum,
    coment?: string,
}

export enum StatusEnum {
    draft     = 'draft', // черновик
    prepared  = 'prepared', // готов к началу планирования
    planed    = 'planed', // запланирован
    performed = 'performed',// выполнен юнитом
    ready     = 'ready', // готов (проверен на брак)
    defective = 'defective', // бракован
    cancelled = 'cancelled', // отменен   
}
export interface TCardProductItem {
    id?: number,  // id BD
    idc: number, //  id на клиенте
    codeS: string, //  код источника
    title: string,
    qtu: number,
    uom: UOMItem,
}
export interface TCardItem {
    id: number,
    date: Date, //  дата 
    // active?: boolean, // активная карта из списка
    number: number, // поле для синхронизации с внешними системами
    modified: boolean, // указание что модифицирована и не сохранена
    tCardProducts?: TCardProductItem[],
    tCardWastes?: TCardProductItem[],
    tCardOperations?: TCardOperationItem[],
    tCardMaterials?: TCardProductItem[],
    maxId: number, // это счетчик id в пределах карты  -  обеспечивает сквозную id в карте
    coment?: string,
    status:StatusEnum
}
// расширение интерфейса
export interface TCardTermsItem extends TCardItem {
    readyTerm: { date: string, time: number }, // срок готовности
    expand: boolean, //  состояние развернутости и свернутости
    tCardOperations: TCardOperationTermsItem[],
  }
// расширение интерфейса
export interface TCardOperationTermsItem extends TCardOperationItem {
    readyTerm: { date: string, time: number }, // срок готовности
    expand: boolean, //  состояние развернутости и свернутости
  }


export interface UOMItem {
    id: number,
    title: string,
    code?: string, // для синхронизации 
    modified?: boolean, // указание что модифицирована и не сохранена
}
export interface ActionItem {
    id: number,
    title: string,
    code?: string, // для синхронизации 
    modified?: boolean, // указание что модифицирована и не сохранена
    interruptible:boolean, // можно ли прервать операцию с окончанием смены а потом продолжитть на след день
}
export interface UnitItem {
    id?: number,
    title: string,
    code: string, // для синхронизации 
    actions: UnitActionItem[],
    retool: number, // общее время на переналадку станка между каждой операцией  в минутах
    modified: boolean, // указание что модифицирована и не сохранена
    belong: UnitBelongEnum,
    type: UnitTypeEnum,
    coment?: string
}

export interface UnitKPIItem {
    unit: UnitItem;
    date: string; // "YYYY-MM-DD"
    productionTime: number;
    occupiedTime: number;
    planedTime: number;
    effectiveTime: number;
    defectTime: number;
  }
  

export interface UnitActionItem {
    id?: number,
    action: ActionItem,
    koef: number
}

// ТБ users
export interface UserItem {
    id: number,
    login: string,
    pass: string, 
    name: string,
    locale: string,
    isAdmin:boolean
}

export enum UserRoleEnum {
    OPERATOR = "оператор",
    PLANNER = "планер",
    UNIT = "юнит",
    CONTROL = "контролер",
}

// хранить обрабатывать
export enum UnitTypeEnum {
    keep = 'keep',
    process = 'process',
    control = 'control',
}
// свой чужой
export enum UnitBelongEnum {
    inner = 'inner',
    outer = 'outer',
}

// компания
export interface TeamItem {
    id:number,
    title: string;  
    coment: string,
    prefix: string,   
}

// Шкала времени
///////////////////////////// 
export enum DaysOfWeek {
   
    SUNDAY = "SUNDAY",
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY"
  }

// рабочее  время компании
export interface ScheduleItem {
    team: TeamItem,    
    timeStartWork: number, // минут с начала дня 
    timeFinishWork: number, // минут с начала дня 
    breaks:{ timeStart:number, timeFinish:number}[] // минут с начала дня 
    holidays:string[], // даты не работы в рабочие дни (празднии) в строковом формате
    weekends:DaysOfWeek[], // дни недели по номерам   - понедельник 1, воскресенье 7 
    workdays:{ date:string,timeStart:number, timeFinish:number}[], // даты(в строковом формате) работы в выходные  (переносы)
    timeZone:TimeZoneEnum
}

// Описание дня
export interface CalendarItem {
    idDay: string,
    date: Date,
    mounth: boolean,
    day: boolean,
    timeStartWork: number, // минут с начала дня 
    timeFinishWork: number, // минут с начала дня 
    breaks:{timeStart:number,timeFinish:number}[] // минут с начала дня 
}

export interface UnitCalendarItem extends CalendarItem {
    unit:UnitItem,
  }
// Описание операции (отрезка времени) на временной шкале юнита
export interface UnitLoadItem {
    id?:number,
    idc: number, //  id на клиенте
    unit:UnitItem,  
    date:string, //  дата в строковом формате // формат: YYYY-MM-DD
    idc_oper: number,// Для визуализации на шкале
    id_oper: number, // для связи
    id_tCard: number,
    timeStart: number, // здесь в минутах
    timeFinish: number,
    status:StatusEnum    
    isActive:boolean,
    isRetool:boolean, 
    loadInfo?:{title:string,duration:number,interruptible:boolean,koef:number},
    isPinned:boolean,//  перенесен вручшую на шкале
    isOuterStart:boolean,//  это старт оутсортера
    isOuterFinish:boolean,//  это финиш оутсортера
    version:number // версия планирования для связи цепочки лоадов
}
// 
// описание дня работы юнита
export enum TimeTypeEnum {
    work = 'work',
    notWork = 'not work',
    breack = 'breack',
    busy = 'busy', // загружен операцией
    retool = 'retool',
}

//  отклонения юнита от расписания
export interface UnitExceptionItem {
    id:number,
    unitId:number, 
    date:string,
    type: TimeTypeEnum, 
    timeStart:number,
    timeFinish:number
    
}
//  настройки системы
export interface SettingsItem {
    timeStartWork:number, //  начало показа календаря
    timeFinishWork:number, //  конец показа календаря
    showWeekend:boolean, // показывать выходные дни
    showHoliday: boolean,// показывать праздники 
    isQualControl:boolean,// применяется ли контроль качества  
    
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
  