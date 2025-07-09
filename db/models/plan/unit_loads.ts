import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from '../catalogs/teams'; // Подключаем сущность для связи
import { UnitTable } from '../catalogs/units'; // Подключаем сущность для связи
import { TCardTable } from '../data/t_cards'; // Подключаем сущность для связи
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
  date!: Date; // дата операции

  @Column('int')
  id_oper!: number; // Идентификатор операции

  @Column('int')
  idc_oper!: number; // Идентификатор операции

  @ManyToOne(() => TCardTable)
  @JoinColumn({ name: 'id_tCard' })
  tCard!: TCardTable;
  @Column('int')
  id_tCard!: number; // Идентификатор тех карты

  @Column('bigint')
  timeStart!: number; // Время начала в миллисекундах

  @Column('bigint')
  timeFinish!: number; // Время окончания в миллисекундах


  @ManyToOne(() => TeamTable) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
  team!: TeamTable;  // Связь с таблицей TeamTable
  @Column()
  team_id!: number

  @ManyToOne(() => UnitTable)
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitTable;
  @Column()
  unit_id!: number

  @Column({
    type: 'enum',
    enum: StatusEnum,      // Используем enum для ограничения значений
    default: StatusEnum.planed,  // Устанавливаем значение по умолчанию планирован
  })
  status!: StatusEnum;

  @Column('int', { nullable: true })
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
