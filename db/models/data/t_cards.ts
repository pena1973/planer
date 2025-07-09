import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,  } from 'typeorm';
import { TeamTable } from '../../models/catalogs/teams'
import { UserTable } from '../../models/catalogs/users'
import { StatusEnum } from './../../../types/types';

@Entity('t_cards')
export class TCardTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column('date')
  date!: Date; // дата карты

  @ManyToOne(() => UserTable) 
  @JoinColumn({ name: 'user_id' }) 
  user!: UserTable;  
  @Column()
  user_id!: number;

  @ManyToOne(() => TeamTable)
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;
  @Column()
  team_id!: number;

  @Column()
  idc!: number;  // Номер для синхронизации с внешними системами

  @Column({ default: 0 })
  max_idc!: number;  // Счетчик IDс внутри сущьностей карты

  @Column({ type: 'text', default: "" })
  coment?: string; 
  
  @Column({
      type: 'enum',
      enum: StatusEnum,      // Используем enum для ограничения значений
      default: StatusEnum.draft,  // Устанавливаем значение по умолчанию
    })
    status!: StatusEnum;
  
}
