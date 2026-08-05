import { PrismaClient } from "@/generated/prisma";

// Un seul client Prisma partagé (évite d'ouvrir 1000 connexions en dev).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
