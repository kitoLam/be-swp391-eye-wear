"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../env.config");
const connectMongoDB = async () => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        await mongoose_1.default.connect(env_config_1.config.mongodb.uri, options);
        console.log('>>> MongoDB connected successfully');
        mongoose_1.default.connection.on('error', error => {
            console.error('>>> MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('>>> MongoDB disconnected');
        });
        process.on('SIGINT', () => {
            void (async () => {
                await mongoose_1.default.connection.close();
                console.log('MongoDB connection closed due to app termination');
                process.exit(0);
            })();
        });
    }
    catch (error) {
        console.error('>>> MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectMongoDB = connectMongoDB;
