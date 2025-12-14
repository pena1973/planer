import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

@Entity("baners")
export class BanerTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date_from!: string; // дата начала показа банера

    @Column('date')
    date_to!: string; // дата окончания показа банера

    @Column('varchar', { default: "" })
    locale!: string;

    @Column('text')
    message!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column('boolean', { default: false })
    active!: boolean;

    @Column('int', { nullable: true })
    team_id!: number;
    
    @Column('int',{ nullable: true })
    user_id!: number;
}
