import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("bills")
export class BillTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date!: string; // дата счета

    @Column('varchar', { default: "Invoice" })
    title!: string;

    @Column('varchar', { default: "" })
    coment!: string; // комментарий к счету

    @Column('int')
    team_id!: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    amount!: number; // сумма с 2 знаками после запятой
    
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    vat_amount!: number; // сумма с 2 знаками после запятой
    
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    total_amount!: number; // сумма с 2 знаками после запятой
    
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    vat!: number; // сумма с 2 знаками после запятой
}
