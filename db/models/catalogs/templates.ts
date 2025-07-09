import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { TeamTable } from './teams';

@Entity("templates")
export class TemplateTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date; // Время создания записи

    @Column({ default: '' })
    name!: string; // Название шаблона

    @Column({ type: 'text' })
    fileContent!: string; // Содержимое файла в формате JSON (содержимое карты)

    @ManyToOne(() => TeamTable)
    @JoinColumn({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
    team!: TeamTable;  // Ссылка на команду, к которой относится шаблон
    @Column()
    team_id!: number; // Внешний ключ на команду

}
