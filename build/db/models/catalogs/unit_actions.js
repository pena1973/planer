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
exports.UnitActionTable = void 0;
const typeorm_1 = require("typeorm");
let UnitActionTable = class UnitActionTable {
};
exports.UnitActionTable = UnitActionTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UnitActionTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint', { unique: true }),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "idc", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10, // общее количество цифр
        scale: 2, // количество цифр после запятой
        default: 1
    }),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "koef", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", String)
], UnitActionTable.prototype, "coment", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "action_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "unit_idc", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UnitActionTable.prototype, "team_id", void 0);
exports.UnitActionTable = UnitActionTable = __decorate([
    (0, typeorm_1.Entity)("unit_actions")
], UnitActionTable);
