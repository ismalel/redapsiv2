import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Soft delete middleware
prisma.$use(async (params, next) => {
  // Check if model supports soft delete
  const softDeleteModels = ['User', 'Therapy', 'Event'];
  
  if (params.model && softDeleteModels.includes(params.model)) {
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Change to findFirst and add filter
      params.action = 'findFirst';
      params.args.where = { ...params.args.where, deleted_at: null };
    }
    
    if (params.action === 'findMany') {
      // Add filter
      if (params.args.where) {
        if (params.args.where.deleted_at === undefined) {
          params.args.where.deleted_at = null;
        }
      } else {
        params.args.where = { deleted_at: null };
      }
    }

    if (params.action === 'update') {
      params.action = 'updateMany';
      params.args.where = { ...params.args.where, deleted_at: null };
    }

    if (params.action === 'updateMany') {
      if (params.args.where) {
        params.args.where.deleted_at = null;
      } else {
        params.args.where = { deleted_at: null };
      }
    }

    if (params.action === 'delete') {
      // Change to update
      params.action = 'update';
      params.args.data = { deleted_at: new Date() };
    }

    if (params.action === 'deleteMany') {
      // Change to updateMany
      params.action = 'updateMany';
      if (params.args.data) {
        params.args.data.deleted_at = new Date();
      } else {
        params.args.data = { deleted_at: new Date() };
      }
    }
  }
  
  return next(params);
});

export default prisma;
export { prisma };
