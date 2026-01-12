"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHandler = void 0;
const cors_1 = __importDefault(require("cors"));
const env_config_1 = require("../config/env.config");
const corsHandler = () => {
    return (0, cors_1.default)({
        origin: [...env_config_1.config.cors.origin],
        credentials: true,
    });
};
exports.corsHandler = corsHandler;
