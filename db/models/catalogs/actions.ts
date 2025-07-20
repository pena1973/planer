

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity("actions")
export class ActionTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('varchar')
  title!: string;

  @Column('text',{ default: "" })
  coment!: string;

  @Column('varchar', {default:"",nullable:true})
  code!: string;
  
  @Column({default:true})
  interruptible!: boolean;
    
  @Column('int')
  team_id!: number;
}