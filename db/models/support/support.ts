import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from '../../models/catalogs/teams'
import { UserTable } from '../../models/catalogs/users'

@Entity("support")
export class SupportTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date') // дата писма
    date!: Date;

    @Column({ default: "" })
    title!: string;

    @Column({ type: 'text' })
    body!: string; // Содержимое файла в формате JSON (содержимое карты)

    @Column({ default: false })
    fromUser!: boolean;


    @Column({ nullable: true })
    basedOn!: number;  // если это сообщение ответ то здесь id исходного письма.


    @ManyToOne(() => TeamTable, { eager: true }) // Указываем связь "многие к одному"
    @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
    team!: TeamTable;
    @Column()
    team_id!: number;

    @ManyToOne(() => UserTable, { eager: true }) // Указываем связь "многие к одному"
    @JoinColumn({ name: 'user_id' }) // Указываем колонку, которая является внешним ключом
    user!: TeamTable;
    @Column()
    user_id!: number;
}

