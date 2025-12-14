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
exports.UnitTable = void 0;
// db/models/catalogs/units.ts
const TypeORM = __importStar(require("typeorm"));
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;
const types_1 = require("./../../../types/types");
let UnitTable = class UnitTable {
};
exports.UnitTable = UnitTable;
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], UnitTable.prototype, "id", void 0);
__decorate([
    Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UnitTable.prototype, "created_at", void 0);
__decorate([
    Column('bigint', { unique: true }),
    __metadata("design:type", Number)
], UnitTable.prototype, "idc", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], UnitTable.prototype, "title", void 0);
__decorate([
    Column('varchar', { nullable: true }),
    __metadata("design:type", String)
], UnitTable.prototype, "code", void 0);
__decorate([
    Column('int', { default: 0 }),
    __metadata("design:type", Number)
], UnitTable.prototype, "retool", void 0);
__decorate([
    Column('text', { nullable: true, default: "" }),
    __metadata("design:type", String)
], UnitTable.prototype, "coment", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: types_1.UnitBelongEnum,
        default: types_1.UnitBelongEnum.inner
    }),
    __metadata("design:type", String)
], UnitTable.prototype, "belong", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: types_1.UnitTypeEnum,
        default: types_1.UnitTypeEnum.process
    }),
    __metadata("design:type", String)
], UnitTable.prototype, "type", void 0);
__decorate([
    Column('boolean', { default: false }),
    __metadata("design:type", Boolean)
], UnitTable.prototype, "active", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnitTable.prototype, "team_id", void 0);
exports.UnitTable = UnitTable = __decorate([
    Entity("units")
], UnitTable);
