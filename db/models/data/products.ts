// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,  } from 'typeorm';
import { TCardTable } from './t_cards'; 
import { UOMsTable } from '../../models/catalogs/uoms';
import { TypeEnum } from './../../../types/types';

@Entity('products')
export class ProductTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  idc!: number; // id на клиенте

  @Column()
  title!: string;

  @Column()
  sync!: string;

  @ManyToOne(() => UOMsTable) 
  @JoinColumn({ name: 'uom_id' }) 
  uom!: UOMsTable;  
  @Column()
  uom_id!: number;

  @ManyToOne(() => TCardTable)
  @JoinColumn({ name: 'tcard_id' })
  tcard!: TCardTable;
  @Column()
  tcard_id!: number;
}
