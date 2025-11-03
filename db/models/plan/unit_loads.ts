import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { StatusEnum } from './../../../types/types';

@Entity("unit_loads")
export class UnitLoadTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('bigint')
  idc!: number;

  @Column('date')
  date!: string; // дата операции

  @Column('int')
  id_oper!: number; // Идентификатор операции

  @Column('int')
  idc_oper!: number; // Идентификатор операции

  @Column('bigint', {transformer: { to: v => v, from: v => (v==null ? null : Number(v))}}) // bigint превращает в число для совместимости с t_cards.id
  id_tCard!: number; // Идентификатор тех карты

  @Column('bigint')
  timeStart!: number; // Время начала в миллисекундах

  @Column('bigint')
  timeFinish!: number; // Время окончания в миллисекундах

  @Column('int')
  team_id!: number

  @Column('int')
  unit_id!: number

  @Column({
    type: 'enum',
    enum: StatusEnum,      // Используем enum для ограничения значений
    default: StatusEnum.planed,  // Устанавливаем значение по умолчанию планирован
  })
  status!: StatusEnum;

  @Column('bigint', { nullable: true })
  version!: number; // Идентификатор версии планирования если лоад разбит на части (прерываемый)

  @Column('boolean', { default: true })
  isActive!: boolean; // активная

  @Column('boolean', { default: false })
  isRetool!: boolean; // Это ретул

  @Column('boolean', { default: false })
  isPinned!: boolean; // Это признак того что установлен вручную (пришпилен)  

  // для оутсорса
  @Column('boolean', { default: false })
  isOuterStart!: boolean; // Это признак того что установлен вручную (пришпилен)  

  @Column('boolean', { default: false })
  isOuterFinish!: boolean; // Это признак того что установлен вручную (пришпилен)  

  @Column('boolean', { default: false })
  isFirst!: boolean; // Это  признак что лоад первый в цепочке с одинаковой версией

}
