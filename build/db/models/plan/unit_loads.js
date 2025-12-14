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
exports.UnitLoadTable = void 0;
// db/models/plan/unit_loads.ts
const TypeORM = __importStar(require("typeorm"));
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;
const types_1 = require("./../../../types/types");
let UnitLoadTable = class UnitLoadTable {
};
exports.UnitLoadTable = UnitLoadTable;
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id", void 0);
__decorate([
    Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UnitLoadTable.prototype, "created_at", void 0);
__decorate([
    Column('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "idc", void 0);
__decorate([
    Column('date'),
    __metadata("design:type", String)
], UnitLoadTable.prototype, "date", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id_oper", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "idc_oper", void 0);
__decorate([
    Column('bigint', { transformer: { to: v => v, from: v => (v == null ? null : Number(v)) } }) // bigint превращает в число для совместимости с t_cards.id
    ,
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "id_tCard", void 0);
__decorate([
    Column('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "timeStart", void 0);
__decorate([
    Column('bigint'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "timeFinish", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "team_id", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "unit_id", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: types_1.StatusEnum, // Используем enum для ограничения значений
        default: types_1.StatusEnum.planed, // Устанавливаем значение по умолчанию планирован
    }),
    __metadata("design:type", String)
], UnitLoadTable.prototype, "status", void 0);
__decorate([
    Column('bigint', { nullable: true }),
    __metadata("design:type", Number)
], UnitLoadTable.prototype, "version", void 0);
__decorate([
    Column('boolean', { default: true }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isActive", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isRetool", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isPinned", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isOuterStart", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isOuterFinish", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitLoadTable.prototype, "isFirst", void 0);
exports.UnitLoadTable = UnitLoadTable = __decorate([
    Entity("unit_loads")
], UnitLoadTable);
