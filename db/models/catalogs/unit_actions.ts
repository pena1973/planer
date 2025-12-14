
// db/models/catalogs/unit_actions.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;


@Entity("unit_actions")
export class UnitActionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('bigint', { unique: true })
  idc!: number;
  
  @Column({
    type: 'decimal',
    precision: 10, // общее количество цифр
    scale: 2,      // количество цифр после запятой
    default: 1
  })
  koef!: number;

  @Column('varchar',{ default: "" })
  coment!: string;

  
  @Column('int')
  action_id!: number;

  @Column('int')
  unit_id!: number;
  @Column('bigint')
  unit_idc!: number;

  @Column('int')
  team_id!: number;
}