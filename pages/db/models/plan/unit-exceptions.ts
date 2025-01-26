


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from '../catalogs/companies'; // Подключаем сущность для связи
import { UnitTable } from '../catalogs/units'; // Подключаем сущность для связи

import { TimeTypeEnum } from '../enums'; // Подключаем сущность для связи
// Это отклонения юнита от расписания предприятия
@Entity("unit_exceptions")
export class UnitExceptionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('date')
  date!: Date; // 

  @Column('enum', { enum: TimeTypeEnum })
  type!: TimeTypeEnum; // Тип отклонения (work / not work)

  @Column('int')
  timeStart!: number; // Время начала отклонения в минутах с начала дня

  @Column('int')
  timeFinish!: number; // Время окончания отклонения в минутах с начала дня

  @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей CompanyTable
  @Column()
  company_id!: number
  
  @ManyToOne(() => UnitTable, { eager: true })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitTable;
  @Column()
  unit_id!: number
}
