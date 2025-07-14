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
exports.TCardTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("../../models/catalogs/teams");
const users_1 = require("../../models/catalogs/users");
const types_1 = require("./../../../types/types");
let TCardTable = class TCardTable {
};
exports.TCardTable = TCardTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TCardTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], TCardTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", Date)
], TCardTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_1.UserTable),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_1.UserTable)
], TCardTable.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardTable.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", teams_1.TeamTable)
], TCardTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardTable.prototype, "idc", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TCardTable.prototype, "max_idc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: "" }),
    __metadata("design:type", String)
], TCardTable.prototype, "coment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.StatusEnum, // Используем enum для ограничения значений
        default: types_1.StatusEnum.draft, // Устанавливаем значение по умолчанию
    }),
    __metadata("design:type", String)
], TCardTable.prototype, "status", void 0);
exports.TCardTable = TCardTable = __decorate([
    (0, typeorm_1.Entity)('t_cards')
], TCardTable);
