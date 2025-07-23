
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';

@Entity("users_units")
export class UserUnitTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('int')
  user_id!: number;

  @Column('int')
  team_id!: number;

  @Column('int',{ nullable: true })
  unit_id?: number|null;     

  @Column('boolean',{ default: false })
  active!: boolean; //  запись действующая

}

