
import { Entity, PrimaryGeneratedColumn, Column,  ManyToOne, JoinColumn } from 'typeorm';
import {AgreementTable} from './agreements'
import {UserTable} from './users'

@Entity("user_agree")
export class UserAgreeTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column({default:false})
  signed!: boolean; //  соглашение подписано

@Column({ type: 'date', nullable: true })
date!: Date | null; // дата подписания

  @ManyToOne(() => UserTable) 
  @JoinColumn({ name: 'user_id' })
  user!: UserTable;  
  @Column()
  user_id!: number;

  @ManyToOne(() => AgreementTable)
  @JoinColumn({ name: 'agreement_id' })
  agreement!: AgreementTable;  
  @Column()
  agreement_id!: number;
}
