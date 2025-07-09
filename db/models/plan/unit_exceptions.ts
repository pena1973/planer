


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from '../catalogs/teams'; // Подключаем сущность для связи
import { UnitTable } from '../catalogs/units'; // Подключаем сущность для связи

import { TimeTypeEnum } from './../../../types/types'; // Подключаем сущность для связи
// Это отклонения юнита от расписания предприятия
@Entity("unit_exceptions")
export class UnitExceptionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('int', { unique: true })
  idc!: number;
  
  @Column('date')
  date!: Date; // 

  @Column('enum', { enum: TimeTypeEnum })
  type!: TimeTypeEnum; // Тип времени

  @Column('int')
  timeStart!: number; // Время начала отклонения в минутах с начала дня

  @Column('int')
  timeFinish!: number; // Время окончания отклонения в минутах с начала дня

  @ManyToOne(() => TeamTable) 
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;  
  @Column()
  team_id!: number
  
  @ManyToOne(() => UnitTable)
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitTable;
  @Column()
  unit_id!: number
  @Column()
  unit_idc!: number;

}
