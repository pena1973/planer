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
exports.TCardProductTable = void 0;
//  Это строка в которой продукт + количество + код - 
const typeorm_1 = require("typeorm");
const types_1 = require("./../../../types/types");
let TCardProductTable = class TCardProductTable {
};
exports.TCardProductTable = TCardProductTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TCardProductTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], TCardProductTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], TCardProductTable.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.TypeEnum, // Используем enum для ограничения значений
        default: types_1.TypeEnum.M, // Устанавливаем значение по умолчанию
    }),
    __metadata("design:type", String)
], TCardProductTable.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], TCardProductTable.prototype, "qtu", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], TCardProductTable.prototype, "tcard_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Object)
], TCardProductTable.prototype, "operation_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], TCardProductTable.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], TCardProductTable.prototype, "team_id", void 0);
exports.TCardProductTable = TCardProductTable = __decorate([
    (0, typeorm_1.Entity)('t_card_products')
], TCardProductTable);
