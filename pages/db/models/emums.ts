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