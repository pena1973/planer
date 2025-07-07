"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeZoneEnum = exports.TimeTypeEnum = exports.DaysOfWeek = exports.UnitBelongEnum = exports.UnitTypeEnum = exports.StatusEnum = exports.TypeEnum = void 0;
var TypeEnum;
(function (TypeEnum) {
    TypeEnum["P"] = "P";
    TypeEnum["W"] = "W";
    TypeEnum["M"] = "M";
    TypeEnum["I"] = "I";
    TypeEnum["O"] = "O";
    TypeEnum["A"] = "A";
})(TypeEnum || (exports.TypeEnum = TypeEnum = {}));
var StatusEnum;
(function (StatusEnum) {
    StatusEnum["draft"] = "draft";
    StatusEnum["prepared"] = "prepared";
    StatusEnum["planed"] = "planed";
    StatusEnum["performed"] = "performed";
    StatusEnum["ready"] = "ready";
    StatusEnum["defective"] = "defective";
    StatusEnum["cancelled"] = "cancelled";
    StatusEnum["closed"] = "closed";
})(StatusEnum || (exports.StatusEnum = StatusEnum = {}));
// хранить обрабатывать
var UnitTypeEnum;
(function (UnitTypeEnum) {
    UnitTypeEnum["keep"] = "keep";
    UnitTypeEnum["process"] = "process";
    UnitTypeEnum["control"] = "control";
})(UnitTypeEnum || (exports.UnitTypeEnum = UnitTypeEnum = {}));
// свой чужой
var UnitBelongEnum;
(function (UnitBelongEnum) {
    UnitBelongEnum["inner"] = "inner";
    UnitBelongEnum["outer"] = "outer";
})(UnitBelongEnum || (exports.UnitBelongEnum = UnitBelongEnum = {}));
// Шкала времени
///////////////////////////// 
var DaysOfWeek;
(function (DaysOfWeek) {
    DaysOfWeek["SUNDAY"] = "SUNDAY";
    DaysOfWeek["MONDAY"] = "MONDAY";
    DaysOfWeek["TUESDAY"] = "TUESDAY";
    DaysOfWeek["WEDNESDAY"] = "WEDNESDAY";
    DaysOfWeek["THURSDAY"] = "THURSDAY";
    DaysOfWeek["FRIDAY"] = "FRIDAY";
    DaysOfWeek["SATURDAY"] = "SATURDAY";
})(DaysOfWeek || (exports.DaysOfWeek = DaysOfWeek = {}));
// 
// описание дня работы юнита
var TimeTypeEnum;
(function (TimeTypeEnum) {
    TimeTypeEnum["work"] = "work";
    TimeTypeEnum["notWork"] = "not work";
    TimeTypeEnum["breack"] = "breack";
    TimeTypeEnum["busy"] = "busy";
    TimeTypeEnum["retool"] = "retool";
})(TimeTypeEnum || (exports.TimeTypeEnum = TimeTypeEnum = {}));
var TimeZoneEnum;
(function (TimeZoneEnum) {
    // UTC 0
    TimeZoneEnum["Europe/Lisbon"] = "Europe/Lisbon, UTC+0";
    TimeZoneEnum["Europe/Dublin"] = "Europe/Dublin, UTC+0";
    // UTC +1
    TimeZoneEnum["Europe/Paris"] = "Europe/Paris, UTC+1";
    TimeZoneEnum["Europe/Berlin"] = "Europe/Berlin, UTC+1";
    TimeZoneEnum["Europe/Madrid"] = "Europe/Madrid, UTC+1";
    TimeZoneEnum["Europe/Rome"] = "Europe/Rome, UTC+1";
    TimeZoneEnum["Europe/Amsterdam"] = "Europe/Amsterdam, UTC+1";
    TimeZoneEnum["Europe/Brussels"] = "Europe/Brussels, UTC+1";
    TimeZoneEnum["Europe/Oslo"] = "Europe/Oslo, UTC+1";
    TimeZoneEnum["Europe/Copenhagen"] = "Europe/Copenhagen, UTC+1";
    TimeZoneEnum["Europe/Stockholm"] = "Europe/Stockholm, UTC+1";
    TimeZoneEnum["Europe/Vienna"] = "Europe/Vienna, UTC+1";
    TimeZoneEnum["Europe/Prague"] = "Europe/Prague, UTC+1";
    TimeZoneEnum["Europe/Zurich"] = "Europe/Zurich, UTC+1";
    TimeZoneEnum["Europe/Luxembourg"] = "Europe/Luxembourg, UTC+1";
    // UTC +2
    TimeZoneEnum["Europe/Helsinki"] = "Europe/Helsinki, UTC+2";
    TimeZoneEnum["Europe/Sofia"] = "Europe/Sofia, UTC+2";
    TimeZoneEnum["Europe/Bucharest"] = "Europe/Bucharest, UTC+2";
    TimeZoneEnum["Europe/Riga"] = "Europe/Riga, UTC+2";
    // Россия
    TimeZoneEnum["Europe/Kaliningrad"] = "Europe/Kaliningrad, UTC+2";
    TimeZoneEnum["Europe/Moscow"] = "Europe/Moscow, UTC+3";
    TimeZoneEnum["Europe/Volgograd"] = "Europe/Volgograd, UTC+4";
    TimeZoneEnum["Europe/Yekaterinburg"] = "Europe/Yekaterinburg, UTC+5";
    TimeZoneEnum["Europe/Omsk"] = "Europe/Omsk, UTC+6";
    TimeZoneEnum["Europe/Krasnoyarsk"] = "Europe/Krasnoyarsk, UTC+7";
    TimeZoneEnum["Europe/Irkutsk"] = "Europe/Irkutsk, UTC+8";
    TimeZoneEnum["Europe/Chita"] = "Europe/Chita, UTC+9";
    TimeZoneEnum["Europe/Vladivostok"] = "Europe/Vladivostok, UTC+10";
    TimeZoneEnum["Europe/Magadan"] = "Europe/Magadan, UTC+11";
    TimeZoneEnum["Europe/Kamchatka"] = "Europe/Kamchatka, UTC+12";
    // Казахстан
    TimeZoneEnum["Asia/Almaty"] = "Asia/Almaty, UTC+6";
    TimeZoneEnum["Asia/Aqtobe"] = "Asia/Aqtobe, UTC+5";
    TimeZoneEnum["Asia/Atyrau"] = "Asia/Atyrau, UTC+5";
    TimeZoneEnum["Asia/Qyzylorda"] = "Asia/Qyzylorda, UTC+6";
    TimeZoneEnum["Asia/Shymkent"] = "Asia/Shymkent, UTC+6";
    TimeZoneEnum["Asia/Oskemen"] = "Asia/Oskemen, UTC+6";
    TimeZoneEnum["Asia/Pavlodar"] = "Asia/Pavlodar, UTC+6";
    TimeZoneEnum["Asia/Karaganda"] = "Asia/Karaganda, UTC+6";
})(TimeZoneEnum || (exports.TimeZoneEnum = TimeZoneEnum = {}));
