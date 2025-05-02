
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {TeamTable} from './teams'

@Entity("users")
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column({default:""})
  name!: string;

  @Column()
  login!: string;

  @Column()
  pass!: string;

  @Column({default:""})
  loginhash!: string;

  @Column({default:"en"})
  locale!: string;

  @Column({default:false})
  isAdmin!: boolean;
  
  @Column({default:false})
  confirmed!: boolean; //  е мейл подтвержден

  @Column({default:""})
  coment!: string;

  @Column({ default: true })
  active!: boolean; //  запись действующая
  
  @ManyToOne(() => TeamTable, { eager: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
  team!: TeamTable;  
  @Column()
  team_id!: number;

}
