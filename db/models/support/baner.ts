import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("bills")
export class BillTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('dateFrom')
    dateFrom!: Date; // дата начала показа банера

    @Column('dateTo')
    dateTo!: Date; // дата окончания показа банера

    @Column('varchar', { default: "" })
    locale!: string;

    @Column( 'text' )
    message!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column('boolean', { default: false })
    active!: boolean;

    @Column('int')
    team_id!: number;
}
