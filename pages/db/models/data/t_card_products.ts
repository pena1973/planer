import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany, } from 'typeorm';
import { TCardTable } from './t_cards'; // Импортируем зависимую сущность
import { UOMsTable } from '@/pages/db/models/catalogs/uoms';

import { TypeEnum } from '@/types';

import { TCardOperationTable } from './t_card_operations'; // Импортируем зависимую сущность

@Entity('t_card_products')
export class TCardProductTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  idc!: number; // id на клиенте

  @Column()
  code_s!: string;

  @Column({
    type: 'enum',
    enum: TypeEnum,      // Используем enum для ограничения значений
    default: TypeEnum.M,  // Устанавливаем значение по умолчанию
  })
  type!: TypeEnum;

  @Column()
  title!: string;

  @Column('int')
  qtu!: number;

  @ManyToOne(() => UOMsTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'uom_id' }) // Указываем колонку, которая является внешним ключом
  uom!: UOMsTable;  // Связь с таблицей UOMsTable
  @Column()
  uom_id!: number;

  @ManyToOne(() => TCardTable,  { eager: true, cascade:true })
  @JoinColumn({ name: 'tcard_id' })
  tcard!: TCardTable;
  @Column()
  tcard_id!: number;


  @ManyToOne(() => TCardOperationTable, { eager: true, nullable: true, cascade:true })
  @JoinColumn({ name: 'operation_id' })
  operation!: TCardOperationTable|null;
  @Column({ nullable: true })
  operation_id!: number | null;
}
