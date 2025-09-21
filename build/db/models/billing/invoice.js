"use strict";
// db/models/billing/invoice.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceTable = void 0;
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
const typeorm_1 = require("typeorm");
let InvoiceTable = class InvoiceTable {
};
exports.InvoiceTable = InvoiceTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InvoiceTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ name: 'stripe_invoice_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "stripe_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_invoice_number', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "stripe_invoice_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "stripe_customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'int' }),
    __metadata("design:type", Number)
], InvoiceTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'paid' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency', type: 'char', length: 3 }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_subtotal', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "amount_subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_amount', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "tax_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_total', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "amount_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hosted_invoice_url', type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "hosted_invoice_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_pdf_url', type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "invoice_pdf_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_email', type: 'varchar', length: 255, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_country', type: 'char', length: 2, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_vat_id', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_vat_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InvoiceTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamptz', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "paid_at", void 0);
exports.InvoiceTable = InvoiceTable = __decorate([
    (0, typeorm_1.Entity)({ name: 'invoices' })
], InvoiceTable);
