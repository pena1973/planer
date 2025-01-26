// Определение перечисления
export enum TypeEnum {
  P = 'P',
  W = 'W',
  M = 'M',
  I = 'I',
  O = 'O',
}
// Статусы операций
export enum StatusEnum {
  Dr = 'Draft',
  Rd = 'Prepared',
  Pl = 'Planed',
  Cm = 'Completed',
  Cn = 'Cancelled',
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
// Статусы операций в карте
export enum OperStatusEnum {
  D = 'draft', // создан
  P = 'planed', // запланирован
  R = 'ready', // выполнен
  C = 'canceled', // отменен
  F = 'faulty', // бракован
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