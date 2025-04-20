
import { Entity, PrimaryGeneratedColumn, Column,} from 'typeorm';

@Entity("agreements")
export class AgreementTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('date')
  date!: Date; // дата создания

  @Column({default:"",type:"text"})
  text!: string;
  
  @Column({default:"en",type:"varchar"})
  locale!: string;
 
}
