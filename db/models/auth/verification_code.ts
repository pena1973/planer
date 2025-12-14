// db/models/auth/verification_code.ts

import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column, Index } = TypeORM;

export type VerificationPurpose = 'signup' | 'password_reset' | 'email_change' | 'login_2fa';

@Entity({ name: 'verification_codes' })
export class VerificationCodeTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  purpose!: VerificationPurpose;

  @Column({ type: 'varchar', length: 400 })
  code_hash!: string;                 // scrypt-хэш (с солью в префиксе)

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'int', default: 6 })
  max_attempts!: number;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  request_ip!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, any> | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;
}
