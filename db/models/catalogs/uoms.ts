
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("uoms")
export class UOMsTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('varchar')
  title!: string;

  @Column('text', { default: "" })
  coment!: string;

  @Column('varchar',{ default: "", nullable: true })
  code!: string;
  
  @Column('int')
  team_id!: number;
}
