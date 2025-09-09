import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import { StatusEnum } from './../../../types/types';

@Entity('t_cards')
export class TCardTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column('date')
  date!: string; // дата карты

  @Column('int')
  user_id!: number;
  
  @Column('int')
  team_id!: number;

  @Column('int')
  idc!: number;  // Номер для синхронизации с внешними системами

  @Column('int',{ default: 0 })
  max_idc!: number;  // Счетчик IDс внутри сущьностей карты

  @Column('text',{ default: "" })
  coment?: string; 
  
  @Column({
      type: 'enum',
      enum: StatusEnum,      // Используем enum для ограничения значений
      default: StatusEnum.draft,  // Устанавливаем значение по умолчанию
    })
    status!: StatusEnum;
}
