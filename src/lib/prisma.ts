import * as PrismaModule from "@prisma/client";

type PrismaClientType = new (...args: any[]) => any;

const PrismaClient = (PrismaModule as any).PrismaClient as PrismaClientType;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;