
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from './teams'
import { ActionTable } from './actions'
import { UnitTable } from './units'

@Entity("unit_actions")
export class UnitActionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('int', { unique: true })
  idc!: number;
  
  @Column({
    type: 'decimal',
    precision: 10, // общее количество цифр
    scale: 2,      // количество цифр после запятой
    default: 1
  })
  koef!: number;

  @Column({ default: "" })
  coment!: string;

  @ManyToOne(() => ActionTable) 
  @JoinColumn({ name: 'action_id' })
  action!: ActionTable; 
  @Column()
  action_id!: number;

  @ManyToOne(() => UnitTable)
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitTable;
  @Column()
  unit_id!: number;
  @Column()
  unit_idc!: number;

  @ManyToOne(() => TeamTable)
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;
  @Column()
  team_id!: number;
}