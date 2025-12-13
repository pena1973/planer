// db/models/logger/logger.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,Index } = TypeORM;

import { LogLevelEnum, LogOriginEnum} from './../../../types/service-types';

@Entity({ name: "system_logs" })
export class SystemLogTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index("idx_logs_created_at")
  @CreateDateColumn()
  created_at!: Date;

  @Index("idx_logs_level")
  @Column({ type: "varchar", length: 50 })
  level!: LogLevelEnum;

  @Index("idx_logs_origin")
  @Column({ type: "varchar", length: 20 })
  origin!: LogOriginEnum;

  @Index("idx_logs_user_id")
  @Column({ type: "int", nullable: true })
  user_id!: number | null;

  @Index("idx_logs_event")
  @Column({ type: "varchar", length: 120 })
  event!: string;

  
  @Column({ type: "varchar", length: 120 })
  location!: string; // файл:строка или эндпойнт
  
  @Column({ type: "text" })
  message!: string;

  @Column({ type: "jsonb", nullable: true })
  context!: unknown | null;
 
}
