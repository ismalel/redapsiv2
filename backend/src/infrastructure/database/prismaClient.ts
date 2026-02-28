import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        const result = await query(args);
        if (result && (result as any).deleted_at !== null) return null;
        return result;
      },
      async delete({ args }) {
        return (basePrisma as any).user.update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ args }) {
        return (basePrisma as any).user.updateMany({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      }
    },
    therapy: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        const result = await query(args);
        if (result && (result as any).deleted_at !== null) return null;
        return result;
      },
      async delete({ args }) {
        return (basePrisma as any).therapy.update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ args }) {
        return (basePrisma as any).therapy.updateMany({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      }
    },
    event: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deleted_at: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        const result = await query(args);
        if (result && (result as any).deleted_at !== null) return null;
        return result;
      },
      async delete({ args }) {
        return (basePrisma as any).event.update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ args }) {
        return (basePrisma as any).event.updateMany({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      }
    }
  }
});

export default prisma;
export { prisma };
