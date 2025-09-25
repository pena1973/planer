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
exports.SystemLogTable = void 0;
const typeorm_1 = require("typeorm");
const service_types_1 = require("./../../../types/service-types");
let SystemLogTable = class SystemLogTable {
};
exports.SystemLogTable = SystemLogTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SystemLogTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_logs_created_at"),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SystemLogTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_logs_level"),
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_logs_origin"),
    (0, typeorm_1.Column)({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_logs_user_id"),
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], SystemLogTable.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_logs_event"),
    (0, typeorm_1.Column)({ type: "varchar", length: 120 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 120 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], SystemLogTable.prototype, "context", void 0);
exports.SystemLogTable = SystemLogTable = __decorate([
    (0, typeorm_1.Entity)({ name: "system_logs" })
], SystemLogTable);
