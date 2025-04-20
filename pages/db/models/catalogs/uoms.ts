
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import {TeamTable} from './teams'

@Entity("uoms")
export class UOMsTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  title!: string;

  @Column({ type: 'text', default: "" })
  coment!: string;

  @Column({ default: "", nullable: true })
  code!: string;

  @ManyToOne(() => TeamTable, { eager: true, cascade: true,nullable: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
  team!: TeamTable;  // Связь с таблицей UOMsTable
  @Column()
  team_id!: number;
}
