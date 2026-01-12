"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(message, data) {
        return {
            success: true,
            message,
            data,
        };
    }
    static error(message, code) {
        return {
            success: false,
            message,
            code: code,
        };
    }
}
exports.ApiResponse = ApiResponse;
