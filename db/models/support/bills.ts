import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from '../../models/catalogs/teams'

@Entity("bills")
export class BillTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date')
    date!: Date; // дата карты

    @Column({ default: "" })
    title!: string;

    @Column({ type: 'text' })
    fileContent!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column({ default: false })
    paid!: boolean;

    @ManyToOne(() => TeamTable) // Указываем связь "многие к одному"
    @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
    team!: TeamTable;
    @Column()
    team_id!: number;

}
