
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {CompanyTable} from './companies'

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

  @ManyToOne(() => CompanyTable, { eager: true, cascade:true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей UOMsTable
  @Column()
  company_id!: number;
}