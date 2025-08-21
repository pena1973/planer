import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("bills")
export class BillTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date!: Date; // дата счета

    @Column('varchar', { default: "Invoice" })
    title!: string;

    @Column('varchar', { default: "" })
    coment!: string; // комментарий к счету

    @Column('boolean', { default: false })
    paid!: boolean;
       
    @Column('int')
    team_id!: number;
}
