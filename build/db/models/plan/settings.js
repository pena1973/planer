"use strict";
//  Управляет настройками видимости шкалы времени
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
exports.SettingsTable = void 0;
const typeorm_1 = require("typeorm");
const teams_1 = require("../catalogs/teams"); // Подключаем сущность для связи
let SettingsTable = class SettingsTable {
};
exports.SettingsTable = SettingsTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SettingsTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SettingsTable.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], SettingsTable.prototype, "timeStartWork", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], SettingsTable.prototype, "timeFinishWork", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: true }),
    __metadata("design:type", Boolean)
], SettingsTable.prototype, "showWeekend", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: true }),
    __metadata("design:type", Boolean)
], SettingsTable.prototype, "showHoliday", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: false }),
    __metadata("design:type", Boolean)
], SettingsTable.prototype, "isQualControl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teams_1.TeamTable),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", teams_1.TeamTable)
], SettingsTable.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SettingsTable.prototype, "team_id", void 0);
exports.SettingsTable = SettingsTable = __decorate([
    (0, typeorm_1.Entity)("settings")
], SettingsTable);
