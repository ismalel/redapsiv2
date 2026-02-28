import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  per_page: number,
  statusCode = 200
) => {
  const last_page = Math.ceil(total / per_page);

  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      total,
      page,
      per_page,
      last_page,
    },
  });
};
