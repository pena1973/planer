
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {CompanyTable} from './companies'

@Entity("users")
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени


  @Column()
  email!: string;

  @Column()
  login!: string;

  @Column()
  pass!: string;

  @Column()
  loginhash!: string;

  @Column()
  locale!: string;

  @Column()
  cookieagree!: boolean;

  @Column()
  role!: string;

  @Column()
  confirmed!: boolean;

  @Column()
  coment!: string;

  @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  
  @Column()
  company_id!: number;

}
