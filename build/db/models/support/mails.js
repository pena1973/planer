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
exports.MailTable = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("./../../../types/types");
let MailTable = class MailTable {
};
exports.MailTable = MailTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MailTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], MailTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('date') // дата писма
    ,
    __metadata("design:type", String)
], MailTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", String)
], MailTable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], MailTable.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], MailTable.prototype, "fromUser", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], MailTable.prototype, "basedOn", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], MailTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], MailTable.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], MailTable.prototype, "processed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.StatusEnum, // Используем enum для ограничения значений
        default: types_1.StatusEnum.prepared, // Устанавливаем значение по умолчанию подготовлен
    }),
    __metadata("design:type", String)
], MailTable.prototype, "status", void 0);
exports.MailTable = MailTable = __decorate([
    (0, typeorm_1.Entity)("mails")
], MailTable);
