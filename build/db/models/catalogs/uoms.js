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
exports.UOMsTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("./teams");
let UOMsTable = class UOMsTable {
};
exports.UOMsTable = UOMsTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UOMsTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UOMsTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UOMsTable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: "" }),
    __metadata("design:type", String)
], UOMsTable.prototype, "coment", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "", nullable: true }),
    __metadata("design:type", String)
], UOMsTable.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", teams_1.TeamTable)
], UOMsTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UOMsTable.prototype, "team_id", void 0);
exports.UOMsTable = UOMsTable = __decorate([
    (0, typeorm_1.Entity)("uoms")
], UOMsTable);
