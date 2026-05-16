import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';

const log = createLogger('prisma');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    log.info('Database connected');
  } catch (error) {
    log.error({ err: error }, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    log.info('Database disconnected');
  } catch (error) {
    log.error({ err: error }, 'Failed to disconnect from database');
    throw error;
  }
}

export async function healthCheckPrisma(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}