import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany, } from 'typeorm';

// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TCardTable } from './t_cards'; // Импортируем зависимую сущность

@Entity('t_card_stages')
export class TCardStageTable {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  idc!: number; // id на клиенте

  @Column()
  code!: number;

  @ManyToOne(() => TCardTable,  { eager: true, cascade:true })
  @JoinColumn({ name: 'tcard_id' })
  tcard!: TCardTable;
  @Column()
  tcard_id!: number;

}
