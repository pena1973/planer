
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from './teams'
import { UnitTypeEnum, UnitBelongEnum } from '@/types';

@Entity("units")
export class UnitTable {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column()
  title!: string;

  @Column({ nullable: true })
  code!: string;

  @Column({ default: 0 })
  retool!: number;

  @Column({ nullable: true, default: "" })
  coment!: string;

  @Column({
    type: 'enum',
    enum: UnitBelongEnum,
    default: UnitBelongEnum.inner
  })
  belong!: UnitBelongEnum;

  @Column({
    type: 'enum',
    enum: UnitTypeEnum,
    default: UnitTypeEnum.process
  })
  type!: UnitTypeEnum;


  @ManyToOne(() => TeamTable, { eager: true, cascade: true }) // Указываем связь "многие к одному"
  @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
  team!: TeamTable;  // Связь с таблицей UOMsTable
  @Column()
  team_id!: number;
}