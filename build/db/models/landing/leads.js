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
exports.LeadTable = void 0;
// db/models/leads.ts
const typeorm_1 = require("typeorm");
let LeadTable = class LeadTable {
    constructor() {
        // Статус обработки
        this.status = "new";
        // Источник (гибкий text + CHECK в миграции)
        this.source = "landing";
    }
};
exports.LeadTable = LeadTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint" }),
    __metadata("design:type", Number)
], LeadTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], LeadTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 150 }),
    __metadata("design:type", String)
], LeadTable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 250, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 255, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 50, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 150, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 20, default: "new" }),
    __metadata("design:type", String)
], LeadTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { length: 40, default: "landing" }),
    __metadata("design:type", String)
], LeadTable.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { default: "en" }),
    __metadata("design:type", String)
], LeadTable.prototype, "locale", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], LeadTable.prototype, "agree", void 0);
exports.LeadTable = LeadTable = __decorate([
    (0, typeorm_1.Entity)("leads")
], LeadTable);
