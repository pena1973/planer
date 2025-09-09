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
exports.UnitLoadTable = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("./../../../types/types");
let UnitLoadTable = class UnitLoadTable {
};
exports.UnitLoadTable = UnitLoadTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UnitLoadTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "idc", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], UnitLoadTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id_oper", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "idc_oper", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id_tCard", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "timeStart", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "timeFinish", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.StatusEnum, // Используем enum для ограничения значений
        default: types_1.StatusEnum.planed, // Устанавливаем значение по умолчанию планирован
    }),
    __metadata("design:type", String)
], UnitLoadTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint', { nullable: true }),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: true }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isRetool", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isPinned", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isOuterStart", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isOuterFinish", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isFirst", void 0);
exports.UnitLoadTable = UnitLoadTable = __decorate([
    (0, typeorm_1.Entity)("unit_loads")
], UnitLoadTable);
