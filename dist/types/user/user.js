"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullUser = exports.registerUser = exports.IUser = void 0;
const zod_1 = require("zod");
exports.IUser = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
});
exports.registerUser = exports.IUser.extend({
    phone: zod_1.z.string(),
    email: zod_1.z.string().email(),
});
exports.fullUser = exports.registerUser.extend({
    id: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    deletedAt: zod_1.z.date().nullable(),
});
