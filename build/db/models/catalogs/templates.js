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
exports.TemplateTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("./teams");
let TemplateTable = class TemplateTable {
};
exports.TemplateTable = TemplateTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TemplateTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], TemplateTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], TemplateTable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TemplateTable.prototype, "fileContent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }) // Указываем колонку, которая является внешним ключом
    ,
    __metadata("design:type", teams_1.TeamTable)
], TemplateTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TemplateTable.prototype, "team_id", void 0);
exports.TemplateTable = TemplateTable = __decorate([
    (0, typeorm_1.Entity)("templates")
], TemplateTable);
