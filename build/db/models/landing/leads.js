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
exports.LeadTable = void 0;
// db/models/leads.ts
const TypeORM = __importStar(require("typeorm"));
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;
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
    PrimaryGeneratedColumn({ type: "bigint" }),
    __metadata("design:type", Number)
], LeadTable.prototype, "id", void 0);
__decorate([
    Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], LeadTable.prototype, "created_at", void 0);
__decorate([
    Column("varchar", { length: 150 }),
    __metadata("design:type", String)
], LeadTable.prototype, "name", void 0);
__decorate([
    Column("varchar", { length: 250, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "company", void 0);
__decorate([
    Column("varchar", { length: 255, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "email", void 0);
__decorate([
    Column("varchar", { length: 50, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "phone", void 0);
__decorate([
    Column("varchar", { length: 150, default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "time", void 0);
__decorate([
    Column("text", { default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "message", void 0);
__decorate([
    Column("text", { default: "" }),
    __metadata("design:type", String)
], LeadTable.prototype, "notes", void 0);
__decorate([
    Column("varchar", { length: 20, default: "new" }),
    __metadata("design:type", String)
], LeadTable.prototype, "status", void 0);
__decorate([
    Column("varchar", { length: 40, default: "landing" }),
    __metadata("design:type", String)
], LeadTable.prototype, "source", void 0);
__decorate([
    Column('varchar', { default: "en" }),
    __metadata("design:type", String)
], LeadTable.prototype, "locale", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], LeadTable.prototype, "agree", void 0);
exports.LeadTable = LeadTable = __decorate([
    Entity("leads")
], LeadTable);
