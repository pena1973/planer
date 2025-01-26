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
    status:OperStatusEnum
}
export enum OperStatusEnum {
    D = 'draft', // создан
    P = 'planed', // запланирован
    R = 'ready', // выполнен
    C = 'canceled', // отменен
    F = 'faulty', // бракован
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
    coment?: string
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
    cookieAgree?: boolean
    role: string,
    nickname: string,
    locale: string
}

export enum UserRoleEnum {
    OPERATOR = "оператор",
    PLANNER = "планер",
    UNIT = "юнит"
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

// компания
export interface CompanyItem {
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
export interface CompanyScheduleItem {
    company: CompanyItem,    
    timeStartWork: number, // минут с начала дня 
    timeFinishWork: number, // минут с начала дня 
    breaks:{ timeStart:number, timeFinish:number}[] // минут с начала дня 
    holidays:Date[], // даты не работы в рабочие дни (празднии) 
    weekends:DaysOfWeek[], // дни недели по номерам   - понедельник 1, воскресенье 7 
    workdays:{ date:Date,timeStart:number, timeFinish:number}[], // даты работы в выходные  (переносы)
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

// // загрузка юнита  с массивом дат загрузки
// export interface UnitLoadItem {
//     unit: UnitItem,
//     unitDates: UnitDateItem[]
// }

// Описание операции (отрезка времени) на временной шкале юнита
export interface UnitLoadItem {
    id?:number,
    unit:UnitItem,  //  добавить и убрать лишние сущтности
    date:Date,
    idc_oper: number,    
    id_tCard: number,
    timeStart: number, // здесь в минутах
    timeFinish: number,
    status:OperStatusEnum
}
// 
// описание дня работы юнита
export enum TimeTypeEnum {
    W = 'work',
    N = 'not work',
    B = 'breack',
}

// // загрузка и отклонения в расписании
// export interface UnitDateItem {
//     date: Date,    
//     loads: LoadItem[],
//     calendarExceptions?: {type: TimeTypeEnum, timeStart:number,timeFinish:number}[] // минут с начала дня     
//     // не обязательный параметр   показывает отклонения юнита от общего расписания работы
// }

//  отклонения юнита от расписания
export interface UnitExceptionItem {
    id:number,
    unitId:number, 
    date:Date,
    type: TimeTypeEnum, 
    timeStart:number,
    timeFinish:number
    
}
