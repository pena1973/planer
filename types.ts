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
}

export interface TCardProductItem {
    id?: number,  // id BD
    idc: number, //  id на клиенте
    codeS: string,
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
}
export interface UnitItem {
    id?: number,
    title: string,
    code: string, // для синхронизации 
    actions: UnitActionItem[],
    retool: number, // общее время на переналадку станка между каждой операцией 
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

// Шкала времени
// рабочее и три перерыва
export interface CalendarItem {
    idDay: string,
    date: Date,
    mounth: boolean,
    day: boolean,
    timeStartWork: number, // минут с начала дня 
    timeFinishWork: number, // минут с начала дня 
    timeStartBreack1: number, // минут с начала дня 
    timeFinishBreack1: number, // минут с начала дня 
    timeStartBreack2: number, // минут с начала дня 
    timeFinishBreack2: number, // минут с начала дня 
    timeStartBreack3: number, // минут с начала дня 
    timeFinishBreack3: number, // минут с начала дня 
}

// Загрузка Юнита
// Интервал загрузки юнита ms от начала дня
export interface LoadItem {
    idc_oper: number,
    id_tCard: number,
    msStart: number,
    msFinish: number
}
// загрузка какогото юнита на конкретную дату
export interface DateLoadItem {
    date: Date,
    operations: LoadItem[]
}

// загрузка юнита  с массивом дат загрузки
export interface UnitLoadItem {
    unit: UnitItem,
    loads: DateLoadItem[]
}
