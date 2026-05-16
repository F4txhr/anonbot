"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectPrisma = connectPrisma;
exports.disconnectPrisma = disconnectPrisma;
exports.healthCheckPrisma = healthCheckPrisma;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const log = (0, logger_1.createLogger)('prisma');
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
async function connectPrisma() {
    try {
        await exports.prisma.$connect();
        log.info('Database connected');
    }
    catch (error) {
        log.error({ err: error }, 'Failed to connect to database');
        throw error;
    }
}
async function disconnectPrisma() {
    try {
        await exports.prisma.$disconnect();
        log.info('Database disconnected');
    }
    catch (error) {
        log.error({ err: error }, 'Failed to disconnect from database');
        throw error;
    }
}
async function healthCheckPrisma() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=prisma.js.map