"use strict";
// db/models/billing/invoice.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const TypeORM = __importStar(require("typeorm"));
const { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } = TypeORM;
let InvoiceTable = class InvoiceTable {
};
exports.InvoiceTable = InvoiceTable;
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], InvoiceTable.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ name: 'stripe_invoice_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "stripe_invoice_id", void 0);
__decorate([
    Column({ name: 'stripe_invoice_number', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "stripe_invoice_number", void 0);
__decorate([
    Column({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "stripe_customer_id", void 0);
__decorate([
    Column({ name: 'team_id', type: 'int' }),
    __metadata("design:type", Number)
], InvoiceTable.prototype, "team_id", void 0);
__decorate([
    Column({ name: 'status', type: 'varchar', length: 16, default: 'paid' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "status", void 0);
__decorate([
    Column({ name: 'currency', type: 'char', length: 3 }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "currency", void 0);
__decorate([
    Column({ name: 'amount_subtotal', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "amount_subtotal", void 0);
__decorate([
    Column({ name: 'tax_amount', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "tax_amount", void 0);
__decorate([
    Column({ name: 'amount_total', type: 'bigint' }),
    __metadata("design:type", String)
], InvoiceTable.prototype, "amount_total", void 0);
__decorate([
    Column({ name: 'hosted_invoice_url', type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "hosted_invoice_url", void 0);
__decorate([
    Column({ name: 'invoice_pdf_url', type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "invoice_pdf_url", void 0);
__decorate([
    Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_email", void 0);
__decorate([
    Column({ name: 'customer_country', type: 'char', length: 2, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_country", void 0);
__decorate([
    Column({ name: 'customer_vat_id', type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "customer_vat_id", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InvoiceTable.prototype, "created_at", void 0);
__decorate([
    Column({ name: 'paid_at', type: 'timestamptz', nullable: true, default: null }),
    __metadata("design:type", Object)
], InvoiceTable.prototype, "paid_at", void 0);
exports.InvoiceTable = InvoiceTable = __decorate([
    Entity({ name: 'invoices' })
], InvoiceTable);
