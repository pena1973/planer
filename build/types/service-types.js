"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogOriginEnum = exports.LogLevelEnum = void 0;
var LogLevelEnum;
(function (LogLevelEnum) {
    LogLevelEnum["INFO"] = "info";
    LogLevelEnum["WARN"] = "warn";
    LogLevelEnum["ERROR"] = "error";
    LogLevelEnum["DEBUG"] = "debug";
})(LogLevelEnum || (exports.LogLevelEnum = LogLevelEnum = {}));
var LogOriginEnum;
(function (LogOriginEnum) {
    LogOriginEnum["SERVER"] = "server";
    LogOriginEnum["CLIENT"] = "client";
})(LogOriginEnum || (exports.LogOriginEnum = LogOriginEnum = {}));
