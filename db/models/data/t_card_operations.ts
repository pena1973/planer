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

  @Column('int', {nullable:true})
  action_id!: number;

  @Column('int')
  duration!: number;  // Время в миллисекундах

  @Column('bigint', {transformer: { to: v => v, from: v => (v==null ? null : Number(v))}})
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

  @Column('int')
  team_id!: number;

}
