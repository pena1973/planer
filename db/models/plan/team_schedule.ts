
import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import { DaysOfWeek,TimeZoneEnum } from "./../../../types/types"; // Подключаем сущность для связи


@Entity("team_schedule")
export class TeamScheduleTable {
  
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
  holidays!: string[]; // Даты, когда компания не работает (праздники)

  @Column('simple-array', { nullable: true })
  weekends!: DaysOfWeek[]; // Дни недели, когда компания не работает 

  @Column('json', { nullable: true })
  workdays!: { date: string, timeStart: number, timeFinish: number }[]; // Даты, когда работа возможна в выходные (переносы), использует строковый формат для даты
    
  @Column('int')
  team_id!: number;

  @Column('varchar', {default:"", length: 255 })
  timeZone!: TimeZoneEnum; // Зона в которой работает основное расписание, от нее будем пересчитывать работников
}

