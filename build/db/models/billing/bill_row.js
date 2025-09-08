"use strict";
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
exports.BillRowTable = void 0;
// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
const typeorm_1 = require("typeorm");
let BillRowTable = class BillRowTable {
};
exports.BillRowTable = BillRowTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BillRowTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], BillRowTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], BillRowTable.prototype, "billId", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", Date)
], BillRowTable.prototype, "date_from", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", Date)
], BillRowTable.prototype, "date_to", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", String)
], BillRowTable.prototype, "billable_team_number", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BillRowTable.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)('smallint', { default: 0 }),
    __metadata("design:type", Number)
], BillRowTable.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BillRowTable.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)('smallint', { default: 0 }),
    __metadata("design:type", Number)
], BillRowTable.prototype, "activeDays", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "EUR" }),
    __metadata("design:type", String)
], BillRowTable.prototype, "carency", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], BillRowTable.prototype, "team_id", void 0);
exports.BillRowTable = BillRowTable = __decorate([
    (0, typeorm_1.Entity)('bill_rows')
], BillRowTable);
