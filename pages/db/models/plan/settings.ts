//  Управляет настройками видимости шкалы времени

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from '../catalogs/companies'; // Подключаем сущность для связи


@Entity("settings")
export class SettingsTable {
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
  
  @Column('int')
  timeStartWork!: number; // Минуты с которых показывать  
  
  @Column('int')
  timeFinishWork!: number; // Минуты до которых показывать
  
  @Column('boolean', {default:true} )
  showWeekend!: boolean; // показывать выходные

  @Column('boolean', {default:true} )
  showHoliday!: boolean; // показывать праздники
  
  @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей CompanyTable
  
  @Column()
  company_id!: number;
}

