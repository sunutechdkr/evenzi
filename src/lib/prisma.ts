import { PrismaClient } from "@prisma/client";

// PrismaClient est attaché à l'objet global en développement pour éviter
// d'épuiser le nombre de connexions à la DB au hot reload
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Configuration du client Prisma
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma; 