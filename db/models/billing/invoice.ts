// db/models/billing/invoice.ts

// stripe_invoice_id (например, in_...) — уникальный ключ
// stripe_invoice_number (читаемый номер счета)
// stripe_customer_id (если есть)
// user_id / team_id — чьё это пополнение
// status (draft|open|paid|void|uncollectible)
// currency
// amount_subtotal (в центах)
// tax_amount (в центах)
// amount_total (в центах)
// hosted_invoice_url — страница счета у Stripe
// invoice_pdf_url — прямая ссылка на PDF
// customer_email, customer_country, customer_vat_id (если есть)
// created_at, paid_at

import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'invoices' })
export class InvoiceTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 64 })
  stripe_invoice_id!: string;

  @Column({ name: 'stripe_invoice_number', type: 'varchar', length: 64, nullable: true, default: null })
  stripe_invoice_number!: string | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true, default: null })
  stripe_customer_id!: string | null;

  @Column({ name: 'team_id', type: 'int' })
  team_id!: number;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'paid' })
  status!: string;

  @Column({ name: 'currency', type: 'char', length: 3 })
  currency!: string;

  // В PG bigint возвращается строкой. Если хочешь number — лучше numeric + transformer.
  @Column({ name: 'amount_subtotal', type: 'bigint' })
  amount_subtotal!: string;

  @Column({ name: 'tax_amount', type: 'bigint' })
  tax_amount!: string;

  @Column({ name: 'amount_total', type: 'bigint' })
  amount_total!: string;

  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true, default: null })
  hosted_invoice_url!: string | null;

  @Column({ name: 'invoice_pdf_url', type: 'text', nullable: true, default: null })
  invoice_pdf_url!: string | null;

  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true, default: null })
  customer_email!: string | null;

  @Column({ name: 'customer_country', type: 'char', length: 2, nullable: true, default: null })
  customer_country!: string | null;

  @Column({ name: 'customer_vat_id', type: 'varchar', length: 64, nullable: true, default: null })
  customer_vat_id!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true, default: null })
  paid_at!: Date | null;
}