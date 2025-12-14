// db/models/billing/clients.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;


@Entity('clients')
export class ClientTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // UTC

  @Column('varchar',{default:""})
  title!: string; // название клиента

  @Column('varchar',{default:""})
  reg_n!: string; // VAT номер клиента

  @Column('varchar',{default:""})
  postal_code!: string; 
  
  @Column('varchar',{default:""})
  address_line1!: string; 
  
  @Column('varchar',{default:""})
  address_line2!: string; 

  @Column('varchar',{default:""})
  city!: string; 

  @Column('varchar',{default:""})
  email!: string;

  @Column('varchar',{default:""})
  phone!: string;

  @Column('int')
  team_id!: number;

  @Column({default:"", type: 'char', length: 2 })
  country!: string; // ISO-2 код страны (PT, LV, DE, RU и т.п.)

  @Column('varchar',{default:""})
  customer_id!: string; // для синхронизации со stripe

}