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
exports.UserAgreeTable = void 0;
const typeorm_1 = require("typeorm");
const agreements_1 = require("./agreements");
const users_1 = require("./users");
let UserAgreeTable = class UserAgreeTable {
};
exports.UserAgreeTable = UserAgreeTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserAgreeTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserAgreeTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], UserAgreeTable.prototype, "signed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], UserAgreeTable.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_1.UserTable, { eager: true }) // ссылка на пользователя
    ,
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }) // Указываем колонку, которая является внешним ключом
    ,
    __metadata("design:type", users_1.UserTable)
], UserAgreeTable.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserAgreeTable.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agreements_1.AgreementTable, { eager: true }) // ссылка на соглашение
    ,
    (0, typeorm_1.JoinColumn)({ name: 'agreement_id' }) // Указываем колонку, которая является внешним ключом
    ,
    __metadata("design:type", agreements_1.AgreementTable)
], UserAgreeTable.prototype, "agreement", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserAgreeTable.prototype, "agreement_id", void 0);
exports.UserAgreeTable = UserAgreeTable = __decorate([
    (0, typeorm_1.Entity)("user_agree")
], UserAgreeTable);
