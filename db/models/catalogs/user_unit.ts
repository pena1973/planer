
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from './teams'
import { UnitTable } from './units'
import { UserTable } from './users'

@Entity("users_units")
export class UserUnitTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @ManyToOne(() => UserTable)
  @JoinColumn({ name: 'user_id' })
  user!: UserTable;
  @Column()
  user_id!: number;

  @ManyToOne(() => TeamTable)
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;
  @Column()
  team_id!: number;

 
  @ManyToOne(() => UnitTable, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit?: UnitTable|null;  

  @Column({ nullable: true })
  unit_id?: number|null;  
    

  @Column({type: 'boolean', default: false })
  active!: boolean; //  запись действующая

}

