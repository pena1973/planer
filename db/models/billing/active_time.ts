// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc

import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

@Entity('active_time')
export class ActiveTimeTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
  
  @Column('varchar')
  direction!: string; // старт или финиш активного периода
  
  @Column('varchar')
  date!: string; // дата активности формат en-CA
 
  @Column('int')
  team_id!: number;
}
