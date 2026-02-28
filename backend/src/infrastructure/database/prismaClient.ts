import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
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
      async delete({ model, args }) {
        return (prisma as any)[model].update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ model, args }) {
        return (prisma as any)[model].updateMany({
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
      async delete({ model, args }) {
        return (prisma as any)[model].update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ model, args }) {
        return (prisma as any)[model].updateMany({
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
      async delete({ model, args }) {
        return (prisma as any)[model].update({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      },
      async deleteMany({ model, args }) {
        return (prisma as any)[model].updateMany({
          where: args.where,
          data: { deleted_at: new Date() },
        });
      }
    }
  }
});

export default prisma;
export { prisma };
