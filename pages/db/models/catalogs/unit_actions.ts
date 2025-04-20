
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {TeamTable} from './teams'
import {ActionTable} from './actions'
import {UnitTable} from './units'
@Entity("unit_actions")
export class UnitActionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
   
  @Column({
    type: 'decimal',
    precision: 10, // общее количество цифр
    scale: 2,      // количество цифр после запятой
    default: 1
  })
  koef!: number;

  @Column({default:""})
  coment!: string;
    
  @ManyToOne(() => ActionTable, { eager: true, cascade:true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'action_id' }) // Указываем колонку, которая является внешним ключом
  action!: ActionTable;  // Связь с таблицей UOMsTable
  @Column()
  action_id!: number;
  
  @ManyToOne(() => UnitTable, { eager: true, cascade:true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'unit_id' }) // Указываем колонку, которая является внешним ключом
  unit!: UnitTable;  // Связь с таблицей UOMsTable
  @Column()
  unit_id!: number;
}