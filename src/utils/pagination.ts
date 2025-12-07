import { Types } from 'mongoose';
import { PaginatedResponse, PaginationQuery } from '../types/index.js';

interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Parse pagination query parameters
 */
export const parsePaginationQuery = (
  query: Record<string, unknown>,
  options: PaginationOptions = {}
): PaginationQuery => {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  let limit = defaultLimit;
  if (query.limit) {
    const parsedLimit = parseInt(query.limit as string, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, maxLimit);
    }
  }

  return {
    cursor: query.cursor as string | undefined,
    limit,
    fields: query.fields as string | undefined,
  };
};

/**
 * Build cursor-based query filter
 */
export const buildCursorQuery = (
  cursor?: string
): Record<string, unknown> => {
  if (!cursor) return {};

  // Validate cursor is a valid ObjectId
  if (!Types.ObjectId.isValid(cursor)) {
    return {};
  }

  return { _id: { $gt: new Types.ObjectId(cursor) } };
};

/**
 * Build field selection from query
 */
export const buildFieldSelection = (fields?: string): string => {
  if (!fields) return '';

  // Parse comma-separated fields and sanitize
  const allowedFields = fields
    .split(',')
    .map((f) => f.trim())
    .filter((f) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f))
    .join(' ');

  return allowedFields;
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T extends { _id: unknown }>(
  data: T[],
  limit: number
): PaginatedResponse<T> => {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? String(lastItem._id) : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
};

/**
 * Execute cursor-based paginated query
 */
export const paginatedQuery = async <T extends { _id: unknown }>(
  model: {
    find: (filter: Record<string, unknown>) => {
      select: (fields: string) => {
        sort: (sort: Record<string, number>) => {
          limit: (n: number) => {
            lean: () => Promise<T[]>;
          };
        };
      };
    };
  },
  baseFilter: Record<string, unknown>,
  pagination: PaginationQuery
): Promise<PaginatedResponse<T>> => {
  const { cursor, limit = 20, fields } = pagination;

  // Merge base filter with cursor filter
  const cursorQuery = buildCursorQuery(cursor);
  const filter = { ...baseFilter, ...cursorQuery };

  // Build field selection
  const fieldSelection = buildFieldSelection(fields);

  // Fetch one extra to determine if there are more results
  const items = await model
    .find(filter)
    .select(fieldSelection)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  return createPaginatedResponse(items, limit);
};
