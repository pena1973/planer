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