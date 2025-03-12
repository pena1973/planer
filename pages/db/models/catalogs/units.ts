
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {CompanyTable} from './companies'

@Entity("units")
export class UnitTable {
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  title!: string;

  @Column({nullable:true})
  code!: string;

  @Column({default:0})
  retool!: number;
  
  @Column({nullable:true,default:""})
  coment!: string;
 
  @Column()
  belong!: string;

  @Column()
  type!: string;
  
  @ManyToOne(() => CompanyTable, { eager: true, cascade: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей UOMsTable
  @Column()
  company_id!: number;
}