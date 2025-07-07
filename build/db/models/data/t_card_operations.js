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
exports.TCardOperationTable = void 0;
const typeorm_1 = require("typeorm");
const actions_1 = require("../../models/catalogs/actions");
const t_cards_1 = require("./t_cards"); // Импортируем зависимую сущность
const t_card_stages_1 = require("./t_card_stages"); // Импортируем зависимую сущность
const types_1 = require("./../../../types/types");
let TCardOperationTable = class TCardOperationTable {
};
exports.TCardOperationTable = TCardOperationTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "idc", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => t_card_stages_1.TCardStageTable, { eager: true, cascade: true }),
    (0, typeorm_1.JoinColumn)({ name: 'stage_id' }),
    __metadata("design:type", t_card_stages_1.TCardStageTable)
], TCardOperationTable.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "stage_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => actions_1.ActionTable, { eager: true }) // Указываем связь "многие к одному"
    ,
    (0, typeorm_1.JoinColumn)({ name: 'action_id' }) // Указываем колонку, которая является внешним ключом
    ,
    __metadata("design:type", actions_1.ActionTable)
], TCardOperationTable.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "action_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => t_cards_1.TCardTable, { eager: true, cascade: true }),
    (0, typeorm_1.JoinColumn)({ name: 'tcard_id' }),
    __metadata("design:type", t_cards_1.TCardTable)
], TCardOperationTable.prototype, "tcard", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "tcard_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.StatusEnum, // Используем enum для ограничения значений
        default: types_1.StatusEnum.draft, // Устанавливаем значение по умолчанию
    }),
    __metadata("design:type", String)
], TCardOperationTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: "" }),
    __metadata("design:type", String)
], TCardOperationTable.prototype, "coment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TCardOperationTable.prototype, "fix_oper_idc", void 0);
exports.TCardOperationTable = TCardOperationTable = __decorate([
    (0, typeorm_1.Entity)('t_card_operations')
], TCardOperationTable);
