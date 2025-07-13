//  Это строка в которой продукт + количество + код - 
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,  } from 'typeorm';
import { TCardTable } from './t_cards'; // Импортируем зависимую сущность
import { UOMsTable } from '../../models/catalogs/uoms';
import { ProductTable } from '../../models/data/products';

import { TypeEnum } from './../../../types/types';

import { TCardOperationTable } from './t_card_operations'; // Импортируем зависимую сущность

@Entity('t_card_products')
export class TCardProductTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
  
  // //  заменит
  // @Column()
  // idc!: number; // id на клиенте

  @Column()
  code!: string;

  @Column({
    type: 'enum',
    enum: TypeEnum,      // Используем enum для ограничения значений
    default: TypeEnum.M,  // Устанавливаем значение по умолчанию
  })
  type!: TypeEnum;

  // //  заменит
  // @Column()
  // title!: string;

  @Column('int')
  qtu!: number;

  // //  заменит
  // @ManyToOne(() => UOMsTable, ) // Указываем связь "многие к одному"
  // @JoinColumn({ name: 'uom_id' }) // Указываем колонку, которая является внешним ключом
  // uom!: UOMsTable;  // Связь с таблицей UOMsTable
  // @Column()
  // uom_id!: number;

  @ManyToOne(() => TCardTable  )
  @JoinColumn({ name: 'tcard_id' })
  tcard!: TCardTable;
  @Column()
  tcard_id!: number;

  @ManyToOne(() => TCardOperationTable, { nullable: true})
  @JoinColumn({ name: 'operation_id' })
  operation!: TCardOperationTable|null;
  @Column({ nullable: true })
  operation_id!: number | null;

  //  новый справочник продуктов
  @ManyToOne(() => ProductTable) 
  @JoinColumn({ name: 'product_id' }) 
  product!: ProductTable;  
  @Column('int')
  product_id!: number;
  

}
