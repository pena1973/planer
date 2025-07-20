
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { UnitTypeEnum, UnitBelongEnum } from './../../../types/types';

@Entity("units")
export class UnitTable {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('int', { unique: true })
  idc!: number;
  
  @Column('varchar')
  title!: string;

  @Column('varchar',{ nullable: true })
  code!: string;

  @Column('int',{ default: 0 })
  retool!: number;

  @Column('text',{ nullable: true, default: "" })
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
  
  @Column('boolean',{ default: false })
  active!: boolean; //  запись действующая
  
  @Column('int')
  team_id!: number;
}