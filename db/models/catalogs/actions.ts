

// db/models/catalogs/actions.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;


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