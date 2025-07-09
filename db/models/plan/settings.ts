//  Управляет настройками видимости шкалы времени

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from '../catalogs/teams'; // Подключаем сущность для связи


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

  @Column('boolean', {default:false} )
  isQualControl!: boolean; // использовать контроль качества
  
  @ManyToOne(() => TeamTable)
  @JoinColumn({ name: 'team_id' }) 
  team!: TeamTable;  
  @Column()
  team_id!: number;
}

