
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("user_agree")
export class UserAgreeTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column('boolean',{ default: false })
  signed!: boolean; 

  @Column({ type: 'date', nullable: true })
  date!: Date | null; // дата подписания
  
  @Column('int')
  user_id!: number;
  
  @Column('int')
  agreement_id!: number;
}
