


import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import { TimeTypeEnum } from './../../../types/types'; // Подключаем сущность для связи

// Это отклонения юнита от расписания предприятия
@Entity("unit_exceptions")
export class UnitExceptionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('bigint', { unique: true })
  idc!: number;
  
  @Column('date')
  date!: Date; // 

  @Column('enum', { enum: TimeTypeEnum })
  type!: TimeTypeEnum; // Тип времени

  @Column('int')
  timeStart!: number; // Время начала отклонения в минутах с начала дня

  @Column('int')
  timeFinish!: number; // Время окончания отклонения в минутах с начала дня

  @Column('int')
  team_id!: number
  
  @Column('int')
  unit_id!: number
  @Column('bigint')
  unit_idc!: number;
}
