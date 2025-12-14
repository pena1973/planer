
// db/models/catalogs/agreements.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

@Entity("agreements")
export class AgreementTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('date')
  date!: string; // дата создания

  @Column('text',{default:""})
  text!: string;
  
  @Column('varchar',{default:"en"})
  locale!: string;
 
}
