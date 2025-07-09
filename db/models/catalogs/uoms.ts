
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {TeamTable} from './teams'

@Entity("uoms")
export class UOMsTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column()
  title!: string;

  @Column({ type: 'text', default: "" })
  coment!: string;

  @Column({ default: "", nullable: true })
  code!: string;

  @ManyToOne(() => TeamTable)
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;
  @Column()
  team_id!: number;
}
