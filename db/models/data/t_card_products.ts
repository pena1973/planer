//  Это строка в которой продукт + количество + код - 
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TypeEnum } from './../../../types/types';

@Entity('t_card_products')
export class TCardProductTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('varchar',)
  code!: string;

  @Column({
    type: 'enum',
    enum: TypeEnum,      // Используем enum для ограничения значений
    default: TypeEnum.M,  // Устанавливаем значение по умолчанию
  })
  type!: TypeEnum;

  @Column('int')
  qtu!: number;

  @Column('int')
  tcard_id!: number;

  @Column('int', { nullable: true })
  operation_id!: number | null;

  @Column('int')
  product_id!: number;

  @Column('int')
  team_id!: number;

}
