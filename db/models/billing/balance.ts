import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("balance")
export class BalanceTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('varchar', { default: "" })
    date!: string; // дата транзакции

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    summa!: number; // сумма с 2 знаками после запятой

    @Column('varchar', { default: "" })
    direction!: string; // направление приход/расход

    @Column('varchar', { default: "" })
    document!: string;

    @Column('varchar', { default: "" })
    coment!: string; // комментарий к транзакции

    @Column('boolean', { default: false })
    is_trial!: boolean; // это триальный баланс?

    @Column('int')
    team_id!: number;
}
