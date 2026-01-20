import { z } from 'zod';
import { ApiResponse } from './types';

/**
 * Response validation schemas using Zod
 * These schemas validate API responses at runtime to ensure type safety
 */

/**
 * Base API response schema
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(['SUCCESS', 'FAIL']),
    message: z.string(),
    data: dataSchema,
  }) as z.ZodType<ApiResponse<z.infer<T>>>;

/**
 * Validate API response against schema
 * Throws ZodError if validation fails
 */
export function validateResponse<T>(
  response: unknown,
  schema: z.ZodType<T>
): T {
  return schema.parse(response);
}

/**
 * Safe validate - returns result instead of throwing
 */
export function safeValidateResponse<T>(
  response: unknown,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(response);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Common response schemas
 */
export const commonResponseSchema = {
  /**
   * Response with null data
   */
  null: apiResponseSchema(z.null()),

  /**
   * Response with string data
   */
  string: apiResponseSchema(z.string()),

  /**
   * Response with number data
   */
  number: apiResponseSchema(z.number()),

  /**
   * Response with boolean data
   */
  boolean: apiResponseSchema(z.boolean()),

  /**
   * Response with array of any type
   */
  array: <T extends z.ZodTypeAny>(itemSchema: T) =>
    apiResponseSchema(z.array(itemSchema)),

  /**
   * Response with object of any type
   */
  object: <T extends z.ZodRecord>(recordSchema: T) =>
    apiResponseSchema(recordSchema),
};

/**
 * Pagination metadata schema
 */
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number().optional(),
  size: z.number().optional(),
  limit: z.number().optional(),
});

/**
 * Paginated response schema
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number().optional(),
    size: z.number().optional(),
  });

