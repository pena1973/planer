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
exports.MainTable = void 0;
// Каталог номенклатуры в пределах карты. Уникальный ключ карта idc + продукт idc
const typeorm_1 = require("typeorm");
const decimalToNumber = {
    to: (v) => v,
    from: (v) => (v == null ? null : parseFloat(v)),
};
let MainTable = class MainTable {
};
exports.MainTable = MainTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MainTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], MainTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "reg_n", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "adress", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], MainTable.prototype, "person", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0, transformer: decimalToNumber }),
    __metadata("design:type", Number)
], MainTable.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)('smallint', { default: 0 }),
    __metadata("design:type", Number)
], MainTable.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", String)
], MainTable.prototype, "from", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0, transformer: decimalToNumber }),
    __metadata("design:type", Number)
], MainTable.prototype, "VAT", void 0);
exports.MainTable = MainTable = __decorate([
    (0, typeorm_1.Entity)('main')
], MainTable);
