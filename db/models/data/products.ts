// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class ProductTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('int')
  idc!: number; // id на клиенте

  @Column('varchar')
  title!: string;

  @Column('varchar')
  sync!: string;

  @Column('int')
  uom_id!: number;

  @Column('int')
  tcard_id!: number;

  @Column('int')
  team_id!: number;
}
