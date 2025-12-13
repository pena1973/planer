// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
// db/models/data/products.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

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

  @Column('bigint', {transformer: { to: v => v, from: v => (v==null ? null : Number(v))}})
  tcard_id!: number;

  @Column('int')
  team_id!: number;
}
