// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bill_rows')
export class BillRowTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('int')
  bill!: number; // id счета

  @Column('date')
  date_from!: Date; // Услуга с
  
  @Column('date')
  date_to!: Date; // Услуга по
  
  @Column('varchar')
  billable_team_id!: string; // За какую команду выставлен счет

  @Column('varchar')
  discaunt!: number; // Процент скидки от базовой цены

  @Column('varchar')
  amount!: string; // сумма

  @Column('varchar')
  carency!: string; // валюта
  
  @Column('int')
  team_id!: number; // id основной команды
}
