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
exports.UnitExceptionTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("../catalogs/teams"); // Подключаем сущность для связи
const units_1 = require("../catalogs/units"); // Подключаем сущность для связи
const types_1 = require("./../../../types/types"); // Подключаем сущность для связи
// Это отклонения юнита от расписания предприятия
let UnitExceptionTable = class UnitExceptionTable {
};
exports.UnitExceptionTable = UnitExceptionTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UnitExceptionTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { unique: true }),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "idc", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", Date)
], UnitExceptionTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('enum', { enum: types_1.TimeTypeEnum }),
    __metadata("design:type", String)
], UnitExceptionTable.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "timeStart", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "timeFinish", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable, { eager: true }) // Указываем связь "многие к одному"
    ,
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
    ,
    __metadata("design:type", teams_1.TeamTable)
], UnitExceptionTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => units_1.UnitTable, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", units_1.UnitTable)
], UnitExceptionTable.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UnitExceptionTable.prototype, "unit_idc", void 0);
exports.UnitExceptionTable = UnitExceptionTable = __decorate([
    (0, typeorm_1.Entity)("unit_exceptions")
], UnitExceptionTable);
