// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bill_rows')
export class BillRowTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('int')
  billId!: number; // id счета

  @Column('varchar',{ default: "" })
  date_from!: Date; // Услуга с

  @Column('varchar',{ default: "" })
  date_to!: Date; // Услуга по

  @Column('varchar',{ default: "" })
  billable_team_number!: string; // За какую команду выставлен счет

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  price!: number; // сумма с 2 знаками после запятой

  // Скидка: либо целые проценты…
  @Column('smallint', { default: 0 })
  discount!: number;     // 0..100 (%)// Процент скидки от базовой цены

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  amount!: number; // сумма с 2 знаками после запятой

  @Column('smallint',{ default: 0 })
  activeDays!: number; // сумма с 2 знаками после запятой 

  @Column('varchar',{ default: "EUR" })
  carency!: string; // валюта

  @Column('int')
  team_id!: number; // id основной команды
}
