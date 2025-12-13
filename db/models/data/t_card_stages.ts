// db/models/data/t_card_stages.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

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

  @Column('bigint', {transformer: { to: v => v, from: v => (v==null ? null : Number(v))}})
  tcard_id!: number;
 
  @Column('int')
  team_id!: number;
}
