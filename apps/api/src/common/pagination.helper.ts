import { PaginatedResponse } from '@local-market/shared';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function getPaginationOptions(params: PaginationParams): { skip: number; limit: number; page: number } {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;
  return { skip, limit, page };
}
