


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from '../catalogs/companies'; // Подключаем сущность для связи
import { DaysOfWeek } from '../enums'; // Подключаем сущность для связи

@Entity("company_schedule")
export class CompanyScheduleTable {
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
  
  @Column('int')
  timeStartWork!: number; // Минуты с начала дня для времени начала работы
  
  @Column('int')
  timeFinishWork!: number; // Минуты с начала дня для времени завершения работы
  
  @Column('simple-json', { nullable: true })
  breaks!: { timeStart: number, timeFinish: number }[]; // Перерывы: минуты с начала дня для каждого перерыва

  @Column('date', { array: true, nullable: true })
  holidays!: Date[]; // Даты, когда компания не работает (праздники)

  @Column('simple-array', { nullable: true })
  weekends!: DaysOfWeek[]; // Дни недели, когда компания не работает 

  @Column('json', { nullable: true })
  workdays!: { date: string, timeStart: number, timeFinish: number }[]; // Даты, когда работа возможна в выходные (переносы), использует строковый формат для даты
  
  @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей CompanyTable
  
  @Column()
  company_id!: number;
}

