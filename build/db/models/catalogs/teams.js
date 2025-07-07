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
exports.TeamTable = void 0;
const typeorm_1 = require("typeorm");
let TeamTable = class TeamTable {
    // Хук, который будет вызываться перед вставкой записи в базу данных
    generatePrefixAndUniqueId() {
        if (!this.prefix) {
            // Генерация двух случайных латинских букв
            this.prefix = this.generateRandomPrefix();
        }
    }
    // Функция для генерации случайных двух латинских букв
    generateRandomPrefix() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomIndex1 = Math.floor(Math.random() * letters.length);
        const randomIndex2 = Math.floor(Math.random() * letters.length);
        return `${letters[randomIndex1]}${letters[randomIndex2]}`;
    }
};
exports.TeamTable = TeamTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TeamTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], TeamTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeamTable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: "" }),
    __metadata("design:type", String)
], TeamTable.prototype, "coment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeamTable.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeamTable.prototype, "generatePrefixAndUniqueId", null);
exports.TeamTable = TeamTable = __decorate([
    (0, typeorm_1.Entity)("teams")
], TeamTable);
