
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {TeamTable} from './teams'

@Entity("actions")
export class ActionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  title!: string;

  @Column({ type: 'text', default: "" })
  coment!: string;

  @Column({default:"",nullable:true})
  code!: string;
  
  @Column({default:true})
  interruptible!: boolean;
  
  @ManyToOne(() => TeamTable, { eager: true, cascade:true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
  team!: TeamTable;  // Связь с таблицей UOMsTable
  @Column()
  team_id!: number;
}