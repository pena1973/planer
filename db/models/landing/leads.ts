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

    @Column("varchar", { length: 255, nullable: true })
    email: string | null = null;

    @Column("varchar", { length: 50, nullable: true })
    phone: string | null = null;

    // Текст заявки
    @Column("text", { nullable: true })
    message: string | null = null;

    // Статус обработки
    @Column("varchar", { length: 20, default: "new" })
    status: LeadStatus = "new";

    // Источник (гибкий text + CHECK в миграции)
    @Column("varchar", { length: 40, default: "landing" })
    source: LeadSource = "landing";

    @Column('varchar', { default: "" })
    main_team!: string; // основная команда в которой выставляем счет

}
