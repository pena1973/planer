import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("bills")
export class BillTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date!: Date; // дата карты

    @Column('varchar', { default: "" })
    title!: string;

    @Column({ type: 'text' })
    fileContent!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column('boolean', { default: false })
    paid!: boolean;

    @Column('int')
    team_id!: number;
}
