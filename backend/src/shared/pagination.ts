import { Request } from 'express';

export interface PaginationParams {
  page: number;
  per_page: number;
  skip: number;
  take: number;
}

export const parsePagination = (req: Request): PaginationParams => {
  const page = parseInt(req.query.page as string) || 1;
  const per_page = parseInt(req.query.per_page as string) || 20;

  const take = per_page;
  const skip = (page - 1) * per_page;

  return {
    page,
    per_page,
    skip,
    take,
  };
};
