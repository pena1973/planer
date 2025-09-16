import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("support")
export class SupportTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column('date') // дата писма
    date!: string;

    @Column('varchar',{ default: "" })
    title!: string;

    @Column('text')
    body!: string; 

    @Column('boolean',{ default: false })
    fromUser!: boolean;

    @Column('int',{ nullable: true })
    basedOn!: number;  // если это сообщение ответ то здесь id исходного письма.

    @Column('int')
    team_id!: number;
    
    @Column('int')
    user_id!: number;
     
    @Column('boolean', { default: false })
    processed!: boolean;
}

