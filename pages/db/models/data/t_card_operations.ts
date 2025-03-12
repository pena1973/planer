import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany, } from 'typeorm';

import { ActionTable } from '@/pages/db/models/catalogs/actions'

// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TCardTable } from './t_cards'; // Импортируем зависимую сущность
import { TCardStageTable } from './t_card_stages'; // Импортируем зависимую сущность
import { StatusEnum } from '@/pages/db/models/enums';


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

  // @OneToMany(() => TCardProductTable, (product) => product.operation, { cascade: true })
  // products!: TCardProductTable[];
}
