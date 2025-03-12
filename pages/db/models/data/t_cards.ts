import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany, } from 'typeorm';
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UserTable } from '@/pages/db/models/catalogs/users'
import { StatusEnum } from '@/pages/db/models/enums';

@Entity('t_cards')
export class TCardTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date!: Date;

  @ManyToOne(() => UserTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'user_id' }) // Указываем колонку, которая является внешним ключом
  user!: UserTable;  // Связь с таблицей UOMsTable
  @Column()
  user_id!: number;

  @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
  company!: CompanyTable;  // Связь с таблицей UOMsTable
  @Column()
  company_id!: number;

  @Column()
  number!: number;  // Номер для синхронизации с внешними системами

  @Column({ default: 0 })
  max_idc!: number;  // Счетчик ID

  @Column({ type: 'text', default: "" })
  coment?: string; 
  
  @Column({
      type: 'enum',
      enum: StatusEnum,      // Используем enum для ограничения значений
      default: StatusEnum.draft,  // Устанавливаем значение по умолчанию
    })
    status!: StatusEnum;
  
}
