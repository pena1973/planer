import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';

import { ActionTable } from '../../models/catalogs/actions'


import { TCardTable } from './t_cards'; // Импортируем зависимую сущность
import { TCardStageTable } from './t_card_stages'; // Импортируем зависимую сущность
import { StatusEnum } from './../../../types/types';


@Entity('t_card_operations')
export class TCardOperationTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  idc!: number;

  @ManyToOne(() => TCardStageTable, { eager: true, cascade: true })
  @JoinColumn({ name: 'stage_id' })
  stage!: TCardStageTable;
  @Column()
  stage_id!: number;

  @Column({ type: 'int', default: 0 })
  order!: number;  //  порядок визуализации операций на стадиях

  @ManyToOne(() => ActionTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'action_id' }) // Указываем колонку, которая является внешним ключом
  action!: ActionTable;  // Действие
  @Column()
  action_id!: number;

  @Column('int')
  duration!: number;  // Время в миллисекундах

  @ManyToOne(() => TCardTable, { eager: true, cascade: true })
  @JoinColumn({ name: 'tcard_id' })
  tcard!: TCardTable;
  @Column()
  tcard_id!: number;

  @Column({
    type: 'enum',
    enum: StatusEnum,      // Используем enum для ограничения значений
    default: StatusEnum.draft,  // Устанавливаем значение по умолчанию
  })
  status!: StatusEnum;

  
  @Column({ type: 'text', default: "" })
  coment!: string;

 
  @Column({ type: 'int', default: 0 })
  fix_oper_idc!: number;

  // @OneToMany(() => TCardProductTable, (product) => product.operation, { cascade: true })
  // products!: TCardProductTable[];
}
