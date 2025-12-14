"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogTable = void 0;
// db/models/logger/logger.ts
const TypeORM = __importStar(require("typeorm"));
const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } = TypeORM;
const service_types_1 = require("./../../../types/service-types");
let SystemLogTable = class SystemLogTable {
};
exports.SystemLogTable = SystemLogTable;
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], SystemLogTable.prototype, "id", void 0);
__decorate([
    Index("idx_logs_created_at"),
    CreateDateColumn(),
    __metadata("design:type", Date)
], SystemLogTable.prototype, "created_at", void 0);
__decorate([
    Index("idx_logs_level"),
    Column({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "level", void 0);
__decorate([
    Index("idx_logs_origin"),
    Column({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "origin", void 0);
__decorate([
    Index("idx_logs_user_id"),
    Column({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], SystemLogTable.prototype, "user_id", void 0);
__decorate([
    Index("idx_logs_event"),
    Column({ type: "varchar", length: 120 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "event", void 0);
__decorate([
    Column({ type: "varchar", length: 120 }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "location", void 0);
__decorate([
    Column({ type: "text" }),
    __metadata("design:type", String)
], SystemLogTable.prototype, "message", void 0);
__decorate([
    Column({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], SystemLogTable.prototype, "context", void 0);
exports.SystemLogTable = SystemLogTable = __decorate([
    Entity({ name: "system_logs" })
], SystemLogTable);
