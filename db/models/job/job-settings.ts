
import { Entity, PrimaryGeneratedColumn, Column, Index  } from 'typeorm';

import type { JobScheduleType } from './../../../types/service-types';

@Entity({ name: 'job-settings' })
export class JobSettingsTable {
@PrimaryGeneratedColumn()
id!: number;

@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
created_at!: Date;

// Ключ/идентификатор задания (например, 'billing:charge', 'cleanup:core')
@Index({ unique: true })
@Column()
job_key!: string;

// Включено ли расписание
@Column({ default: true })
enabled!: boolean;

// Часовой пояс расписания (важно для корректного подсчёта времени)
@Column({ default: 'Europe/Riga' })
timezone!: string;

// Тип расписания
@Column({ type: 'varchar' })
schedule_type!: JobScheduleType;

// === Параметры для разных типов ===
// monthly: либо конкретный день месяца (1..28/29/30/31), либо end_of_month
@Column({ type: 'int', nullable: true })
monthly_day!: number | null; // например, 15


@Column({ type: 'boolean', default: false })
monthly_end_of_month!: boolean; // true => запуск в последний день месяца


// daily: время HH:mm
@Column({ type: 'varchar', nullable: true })
daily_time!: string | null; // например, '03:30'


// hourly: минута в часе 0..59
@Column({ type: 'int', nullable: true })
hourly_minute!: number | null; // например, 15 => 01:15, 02:15, ...

// every_x_minutes: число минут, период
@Column({ type: 'int', nullable: true })
every_minutes!: number | null; // например, 10 => каждые 10 минут


// Даты запуска
@Index()
@Column({ type: 'timestamptz', nullable: true })
next_run_at!: Date | null;


@Column({ type: 'timestamptz', nullable: true })
last_run_at!: Date | null;

}