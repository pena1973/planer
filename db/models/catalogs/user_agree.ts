
import { Entity, PrimaryGeneratedColumn, Column,  ManyToOne, JoinColumn } from 'typeorm';
import {AgreementTable} from './agreements'
import {UserTable} from './users'

@Entity("user_agree")
export class UserAgreeTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column({default:false})
  signed!: boolean; //  соглашение подписано

@Column({ type: 'date', nullable: true })
date!: Date | null; // дата подписания

  @ManyToOne(() => UserTable, { eager: true }) // ссылка на пользователя
  @JoinColumn({ name: 'user_id' }) // Указываем колонку, которая является внешним ключом
  user!: UserTable;  
  @Column()
  user_id!: number;

  @ManyToOne(() => AgreementTable, { eager: true }) // ссылка на соглашение
  @JoinColumn({ name: 'agreement_id' }) // Указываем колонку, которая является внешним ключом
  agreement!: AgreementTable;  
  @Column()
  agreement_id!: number;
}
