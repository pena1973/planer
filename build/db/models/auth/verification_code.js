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
exports.VerificationCodeTable = void 0;
// db/models/auth/verification_code.ts
const typeorm_1 = require("typeorm");
let VerificationCodeTable = class VerificationCodeTable {
};
exports.VerificationCodeTable = VerificationCodeTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], VerificationCodeTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], VerificationCodeTable.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], VerificationCodeTable.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 400 }),
    __metadata("design:type", String)
], VerificationCodeTable.prototype, "code_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], VerificationCodeTable.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], VerificationCodeTable.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 6 }),
    __metadata("design:type", Number)
], VerificationCodeTable.prototype, "max_attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], VerificationCodeTable.prototype, "used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], VerificationCodeTable.prototype, "request_ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], VerificationCodeTable.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], VerificationCodeTable.prototype, "created_at", void 0);
exports.VerificationCodeTable = VerificationCodeTable = __decorate([
    (0, typeorm_1.Entity)({ name: 'verification_codes' })
], VerificationCodeTable);
