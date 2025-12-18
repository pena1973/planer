// db/models/billing/main.ts
// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc

import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

const decimalToNumber = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v == null ? null : parseFloat(v)),
};

@Entity('main')
export class MainTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('varchar')
  title!: string; // название компании

  @Column('varchar')
  reg_n!: string; // VAT номер компании

  @Column({default:"", type: 'char', length: 2 })
  country!: string; // ISO-2 код страны (PT, LV, DE, RU и т.п.)
    
  @Column('varchar',{default:""})
  postal_code!: string; 
  
  @Column('varchar',{default:""})
  address_line1!: string; 
  
  @Column('varchar',{default:""})
  address_line2!: string; 

  @Column('varchar',{default:""})
  city!: string; 
  
  @Column('varchar')
  email!: string; // email компании

  @Column('varchar')
  phone!: string; // телефон компании

  @Column('varchar')
  person!: string; // контактное лицо компании

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: decimalToNumber })
  price!: number;        // цена в валюте, с копейками/центами

  // Скидка: либо целые проценты…
  @Column('smallint', { default: 0 })
  discount!: number;     // 0..100 (%)

  @Column('varchar',{default:""})
  from!: string; // дата с которой действукт в формате YYYY-MM-DD

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: decimalToNumber })
  VAT!: number;        // НДС в процентах

}


