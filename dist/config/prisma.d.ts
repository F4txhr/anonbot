import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function connectPrisma(): Promise<void>;
export declare function disconnectPrisma(): Promise<void>;
export declare function healthCheckPrisma(): Promise<boolean>;
//# sourceMappingURL=prisma.d.ts.map