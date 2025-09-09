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
exports.SupportTable = void 0;
const typeorm_1 = require("typeorm");
let SupportTable = class SupportTable {
};
exports.SupportTable = SupportTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SupportTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SupportTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('date') // дата писма
    ,
    __metadata("design:type", String)
], SupportTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "" }),
    __metadata("design:type", String)
], SupportTable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], SupportTable.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], SupportTable.prototype, "fromUser", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], SupportTable.prototype, "basedOn", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], SupportTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], SupportTable.prototype, "user_id", void 0);
exports.SupportTable = SupportTable = __decorate([
    (0, typeorm_1.Entity)("support")
], SupportTable);
