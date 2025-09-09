// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('clients')
export class ClientTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
  
  @Column('varchar')
  title!: string; // название клиента
  
  @Column('varchar')
  reg_n!: string; // VAT номер клиента

  @Column('varchar')
  adress!: string; // адрес клиента

  @Column('varchar')
  email!: string; // email клиента

  @Column('varchar')
  phone!: string; // телефон клиента

  @Column('varchar')
  person!: string; // контактное лицо клиента

  @Column('int')
  team_id!: number;
}
