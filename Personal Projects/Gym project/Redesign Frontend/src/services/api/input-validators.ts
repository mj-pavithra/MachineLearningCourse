import { z } from 'zod';
import { ApiError } from './types';

/**
 * Input validation schemas for API request DTOs
 * SECURITY: Validates and sanitizes user inputs before sending to API
 * 
 * @module InputValidators
 */

/**
 * Common validation patterns
 */
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // International phone format: optional +, starts with 1-9, up to 15 digits total
const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/; // Sri Lankan NIC format: 9 digits + V/v/X/x or 12 digits

/**
 * Sanitize string input (remove XSS attempts, trim whitespace)
 */
function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, ''); // Remove angle brackets
}

/**
 * Validate and sanitize email
 */
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .transform(sanitizeString);

/**
 * Validate and sanitize password
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

/**
 * Validate phone number
 * Accepts international format with optional + prefix
 * Must start with digit 1-9 (not 0) after optional +
 */
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(16, 'Phone number must be less than 16 characters')
  .regex(phoneRegex, 'Invalid phone number format. Must be international format (e.g., +94711606520)');

/**
 * Validate NIC (Sri Lankan National Identity Card)
 */
export const nicSchema = z.string()
  .regex(nicRegex, 'Invalid NIC format');

/**
 * Auth DTOs
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().default(false),
});

export const refreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordDtoSchema = z.object({
  email: emailSchema,
});

export const resetPasswordDtoSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  oldPassword: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordDtoSchema = z.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Member DTOs
 */
export const createMemberDtoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(100).transform(sanitizeString),
  email: emailSchema,
  mobile: phoneSchema,
  isAdmin: z.boolean(),
  nic: nicSchema,
  isFullTime: z.boolean(),
  password: passwordSchema.optional(),
});

export const updateMemberDtoSchema = z.object({
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
  isFullTime: z.boolean().optional(),
});

/**
 * Package DTOs
 */
export const createPackageDtoSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(200).transform(sanitizeString),
  description: z.string().max(1000).transform(sanitizeString).optional(),
  sessions: z.number().int().min(1, 'Sessions must be at least 1'),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day'),
  price: z.number().min(0, 'Price must be non-negative'),
  isGroup: z.boolean(),
  isVisible: z.boolean(),
});

export const updatePackageDtoSchema = z.object({
  name: z.string().max(200).transform(sanitizeString).optional(),
  description: z.string().max(1000).transform(sanitizeString).optional(),
  sessions: z.number().int().min(1).optional(),
  durationDays: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  isGroup: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  packageId: z.string().min(1, 'Package ID is required'),
  isActive: z.boolean(),
  updatedAt: z.string().or(z.date()),
});

/**
 * Customer DTOs
 */
export const createCustomerDtoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(100).transform(sanitizeString),
  nic: nicSchema,
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200).transform(sanitizeString),
  addressLine2: z.string().min(1, 'Address line 2 is required').max(200).transform(sanitizeString),
  email: emailSchema,
  relationship: z.string().max(50).transform(sanitizeString).optional(),
  mobileNumber: phoneSchema,
  packageId: z.string().min(1, 'Package ID is required'),
  isMale: z.boolean(),
  dob: z.string().or(z.date()),
  isMarried: z.boolean().optional(),
  whyJoin: z.string().min(1, 'Why join is required').max(500).transform(sanitizeString),
  profession: z.string().max(100).transform(sanitizeString).optional(),
  reference: z.string().max(200).transform(sanitizeString).optional(),
});

export const updateCustomerDtoSchema = z.object({
  updatedAt: z.string().or(z.date()),
  packageId: z.string().min(1).optional(),
  mobileNumber: phoneSchema.optional(),
  availableSessionQuota: z.number().int().min(0).optional(),
  isActive: z.boolean(),
  groupId: z.string().optional(),
  email: emailSchema.optional(),
  nic: nicSchema.optional(),
  firstName: z.string().max(100).transform(sanitizeString).optional(),
  lastName: z.string().max(100).transform(sanitizeString).optional(),
  profession: z.string().max(100).transform(sanitizeString).optional(),
  isMale: z.boolean().optional(),
  dob: z.string().or(z.date()).optional(),
  isMarried: z.boolean().optional(),
  whyJoin: z.string().max(500).transform(sanitizeString).optional(),
  addressLine1: z.string().max(200).transform(sanitizeString).optional(),
  addressLine2: z.string().max(200).transform(sanitizeString).optional(),
  reference: z.string().max(200).transform(sanitizeString).optional(),
  profilePicture: z.string().url().optional(),
  isOnFPmachine: z.boolean().optional(),
  deactivateAt: z.string().or(z.date()).optional(),
});

/**
 * Session DTOs
 */
export const createSessionDtoSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(200).transform(sanitizeString),
  trainerId: z.string().min(1, 'Trainer ID is required'),
  trainerName: z.string().min(1, 'Trainer name is required').max(200).transform(sanitizeString),
});

export const markAttendanceDtoSchema = z.object({
  trainerId: z.string().min(1, 'Trainer ID is required').optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  customerId: z.string().optional(),
  attendance: z.enum(['attended', 'missed', 'cancelled']).optional(),
});

/**
 * Payment DTOs
 */
export const createPaymentDtoSchema = z.object({
  paidFor: z.string().min(1, 'Client ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  month: z.string().min(1, 'Month is required').transform(sanitizeString),
  reference: z.string().min(1, 'Reference is required').max(500).transform(sanitizeString),
  paidBy: z.string().optional(),
});

export const extraPaymentDtoSchema = z.object({
  paidFor: z.string().min(1, 'Client ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  sessionQuota: z.number().int().min(1, 'Session quota must be at least 1'),
});

export const createGroupPaymentDtoSchema = z.object({
  paidFor: z.array(z.string().min(1)).min(1, 'At least one client ID is required'),
  paidBy: z.string().min(1, 'Payer ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  month: z.string().min(1, 'Month is required').transform(sanitizeString),
  reference: z.string().min(1, 'Reference is required').max(500).transform(sanitizeString),
  packageId: z.string().min(1, 'Package ID is required'),
});

/**
 * Equipment DTOs
 */
export const equipmentLocationDtoSchema = z.object({
  room: z.string().max(100).transform(sanitizeString).optional(),
  zone: z.string().max(100).transform(sanitizeString).optional(),
});

export const createEquipmentDtoSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(200).transform(sanitizeString),
  sku: z.string().max(100).transform(sanitizeString).optional(),
  type: z.string().min(1, 'Equipment type is required').max(100).transform(sanitizeString),
  muscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
  model: z.string().min(1, 'Model is required').max(100).transform(sanitizeString),
  brand: z.string().min(1, 'Brand is required').max(100).transform(sanitizeString),
  serialNumber: z.string().max(100).transform(sanitizeString).optional(),
  location: equipmentLocationDtoSchema,
  quantityTotal: z.number().int().min(1, 'Quantity must be at least 1'),
  maintenanceIntervalDays: z.number().int().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateEquipmentDtoSchema = createEquipmentDtoSchema.partial();

export const updateEquipmentStatusDtoSchema = z.object({
  status: z.enum(['active', 'inactive', 'maintenance', 'reserved']),
});

/**
 * Reservation DTOs
 */
export const createReservationDtoSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  reservedQty: z.number().int().min(1, 'Reserved quantity must be at least 1'),
  sessionId: z.string().optional(),
  scheduleId: z.string().optional(),
  customerId: z.string().optional(),
  expiresAt: z.string().or(z.date()),
});

/**
 * Group DTOs
 */
export const createGroupDtoSchema = z.object({
  customerIds: z.array(z.string().min(1)).min(1, 'At least one customer ID is required'),
  relatioship: z.string().max(50).transform(sanitizeString).optional(), // Note: typo in API spec
  packageId: z.string().min(1, 'Package ID is required'),
});

/**
 * ID parameter validation
 */
export const idParamSchema = z.string().min(1, 'ID is required').regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

/**
 * Validate request payload before sending to API
 * Throws ApiError if validation fails
 */
export function validateRequestPayload<T>(
  payload: unknown,
  schema: z.ZodType<T>
): T {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ApiError(
        `Validation failed: ${messages}`,
        400,
        {
          code: 'VALIDATION_ERROR',
          url: undefined,
          method: undefined,
          gymId: undefined,
        }
      );
    }
    throw error;
  }
}

/**
 * Safe validate - returns result instead of throwing
 */
export function safeValidateRequestPayload<T>(
  payload: unknown,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

