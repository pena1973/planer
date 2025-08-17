import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("baners")
export class BanerTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date_from!: Date; // дата начала показа банера

    @Column('date')
    date_to!: Date; // дата окончания показа банера

    @Column('varchar', { default: "" })
    locale!: string;

    @Column( 'text' )
    message!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column('boolean', { default: false })
    active!: boolean;

    @Column('int')
    team_id!: number;
}
