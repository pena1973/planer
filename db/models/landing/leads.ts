// db/models/leads.ts
import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import type { LeadStatus, LeadSource } from './../../../types/leads-types';


@Entity("leads")
export class LeadTable {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number; // BIGSERIAL (через трансформер можно и как number)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

    // Контакты
    @Column("varchar", { length: 150 })
    name!: string;

    @Column("varchar", { length: 250, default: "" })
    company!: string;

    @Column("varchar", { length: 255, default: "" })
    email!: string;

    @Column("varchar", { length: 50, default: "" })
    phone!: string;

    @Column("varchar", { length: 150, default: "" })
    time!: string;

    // Текст заявки
    @Column("text", { default: "" })
    message!: string;

    // Статус обработки
    @Column("varchar", { length: 20, default: "new" })
    status: LeadStatus = "new";

    // Источник (гибкий text + CHECK в миграции)
    @Column("varchar", { length: 40, default: "landing" })
    source: LeadSource = "landing";

    @Column('varchar', { default: "en" })
    locale!: string;

    @Column('boolean', { default: false })
    agree!: boolean;

}
