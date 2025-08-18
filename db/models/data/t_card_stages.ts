import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('t_card_stages')
export class TCardStageTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('int')
  idc!: number; // id на клиенте

  @Column('varchar')
  code!: number;

  @Column('int')
  tcard_id!: number;
 
  @Column('int')
  team_id!: number;
}
