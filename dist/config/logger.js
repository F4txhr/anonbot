"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./env");
const env = (0, env_1.getEnv)();
exports.logger = (0, pino_1.default)({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});
function createLogger(name) {
    return exports.logger.child({ component: name });
}
//# sourceMappingURL=logger.js.map