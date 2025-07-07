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
exports.UserUnitTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("./teams");
const units_1 = require("./units");
const users_1 = require("./users");
let UserUnitTable = class UserUnitTable {
};
exports.UserUnitTable = UserUnitTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserUnitTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserUnitTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_1.UserTable, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_1.UserTable)
], UserUnitTable.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserUnitTable.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", teams_1.TeamTable)
], UserUnitTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserUnitTable.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => units_1.UnitTable, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }) // Указываем внешний ключ для поля unit_id
    ,
    __metadata("design:type", Object)
], UserUnitTable.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], UserUnitTable.prototype, "unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserUnitTable.prototype, "active", void 0);
exports.UserUnitTable = UserUnitTable = __decorate([
    (0, typeorm_1.Entity)("users_units")
], UserUnitTable);
