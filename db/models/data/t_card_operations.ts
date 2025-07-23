import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { StatusEnum } from './../../../types/types';


@Entity('t_card_operations')
export class TCardOperationTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('int')
  idc!: number;

  @Column('int')
  stage_id!: number;

  @Column('int',{ default: 0 })
  order!: number;  //  порядок визуализации операций на стадиях

  @Column('int')
  action_id!: number;

  @Column('int')
  duration!: number;  // Время в миллисекундах

  @Column('int')
  tcard_id!: number;

  @Column({
    type: 'enum',
    enum: StatusEnum,      // Используем enum для ограничения значений
    default: StatusEnum.draft,  // Устанавливаем значение по умолчанию
  })
  status!: StatusEnum;


  @Column('text',{  default: "" })
  coment!: string;


  @Column('int',{  default: 0 })
  fix_oper_idc!: number;


}
