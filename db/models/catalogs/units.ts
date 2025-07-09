
import { Entity, PrimaryGeneratedColumn, Column,  ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from './teams'
import { UnitTypeEnum, UnitBelongEnum } from './../../../types/types';

@Entity("units")
export class UnitTable {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('int', { unique: true })
  idc!: number;
  
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
  
  @Column({ default: false })
  active!: boolean; //  запись действующая

  @ManyToOne(() => TeamTable) 
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable; 
  @Column()
  team_id!: number;
}