# API Integration Guide

This guide provides comprehensive documentation for the API integration layer, including request formation, error handling, token refresh behavior, testing, and mocking.

## Table of Contents

1. [Request Formation](#request-formation)
2. [Error Handling](#error-handling)
3. [Token Refresh Queue](#token-refresh-queue)
4. [Running Tests](#running-tests)
5. [Mocking for Local Development](#mocking-for-local-development)
6. [Generating Types from OpenAPI](#generating-types-from-openapi)
7. [Query Key Naming](#query-key-naming)
8. [Mutation Patterns](#mutation-patterns)

## Request Formation

### Base Configuration

All API requests use a centralized Axios instance configured in `src/services/api/client.ts`:

- **Base URL**: `https://api.payzhe.fit/api/v1` (configurable via `VITE_API_BASE_URL`)
- **Timeout**: 30 seconds
- **Content-Type**: `application/json`
- **Max Body/Content Size**: 10MB

### Headers

Every request automatically includes:

- `Content-Type: application/json`
- `X-Client-Version: <package-version>` - Client application version
- `API-Version: <v1>` - API version (from `VITE_API_VERSION` env var, defaults to `v1`)
- `x-auth-token: <jwt-token>` - JWT authentication token (for authenticated endpoints)
- `gym-id: <gymId>` - Multi-tenant gym ID (for specific endpoints like `/packages/get-all` and `/equipments`)

### Authentication

Most endpoints require authentication via the `x-auth-token` header. The token is automatically extracted from `localStorage` and added to requests by the request interceptor.

**Public Endpoints** (no authentication required):
- `POST /admin/admin-management/login`
- `POST /admin/admin-management/refresh-token`
- `POST /admin/admin-management/forgot-password`
- `PATCH /admin/admin-management/reset-password` (uses token in header for password reset)

### Multi-Tenant Security

The `gymId` is **always** extracted from the JWT token (never trusted from storage) to ensure multi-tenant isolation:

```typescript
const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
const gymId = token ? getGymIdFromToken(token) : null;
```

This ensures that:
- Cross-tenant data access is prevented
- Token refresh state is isolated per gym
- Cache keys include gymId for data isolation

## Error Handling

### ApiError Class

All API errors are wrapped in the `ApiError` class (`src/services/api/types.ts`):

```typescript
class ApiError extends Error {
  status: number;           // HTTP status code
  code?: string;            // Error code (e.g., 'API_FAIL')
  response?: unknown;       // Full response data
  url?: string;            // Request URL
  method?: string;         // HTTP method
  gymId?: string | null;   // Gym ID from token
}
```

### Error Response Format

All API responses follow this format:

```typescript
{
  status: "SUCCESS" | "FAIL",
  message: string,
  data: <response_data>
}
```

If `status !== "SUCCESS"`, an `ApiError` is thrown with:
- HTTP status: 200 (business logic failure)
- Code: `'API_FAIL'`
- Message: `response.message`

### Error Handling in Services

All API services use the `validateApiResponse` helper:

```typescript
import { validateApiResponse, createApiErrorFromAxiosError } from './types';

export async function fetchDashboard(): Promise<DashboardData> {
  try {
    const response = await axiosInstance.get<ApiResponse<DashboardData>>('/dashboard');
    return validateApiResponse(response.data, '/dashboard', 'GET', gymId);
  } catch (error: any) {
    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }
    throw new ApiError(/* ... */);
  }
}
```

### Error Types

The `ApiError` class provides helper methods:

- `isClientError()` - 4xx errors
- `isServerError()` - 5xx errors
- `isAuthError()` - 401 Unauthorized
- `isRateLimitError()` - 429 Too Many Requests
- `isNotFoundError()` - 404 Not Found

## Token Refresh Queue

### How It Works

The token refresh system uses a per-gym queue to handle concurrent requests:

1. **Single Refresh Per Gym**: Only one refresh request is in-flight per `gymId` at a time
2. **Request Queuing**: Concurrent requests with expired tokens wait for the refresh to complete
3. **Automatic Retry**: After refresh, all queued requests are retried with the new token
4. **Failure Handling**: If refresh fails, all queued requests are rejected and user is logged out

### Flow Diagram

```
Request 1 (401) → Check refresh state → Start refresh → Queue request
Request 2 (401) → Check refresh state → Already refreshing → Queue request
Request 3 (401) → Check refresh state → Already refreshing → Queue request

Refresh completes → Process queue → Retry all requests with new token
```

### Security Features

1. **GymId Validation**: The `gymId` from the new token must match the original request's `gymId`
2. **Token Validation**: New token must contain a valid `gymId`
3. **Logout on Mismatch**: If `gymId` mismatch detected, user is logged out immediately

### Error Scenarios

- **Refresh Token Revoked**: All queued requests fail, tokens cleared, user logged out
- **GymId Mismatch**: Logout triggered, security event logged
- **Network Error**: Refresh fails, user logged out after retry limit

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

Runs all unit tests in `tests/unit/` directory using Vitest.

### Contract Tests

```bash
npm run test:contracts
```

Runs contract tests in `tests/contracts/` to verify API contract compatibility.

### E2E Tests

```bash
npm run test:e2e
```

Runs Playwright end-to-end tests in `tests/e2e/`.

### Smoke Tests

```bash
npm run test:smoke
```

Quick smoke tests against a dev/staging backend to verify all endpoints are accessible.

### CI Test Suite

```bash
npm run test:ci
```

Runs unit tests, contract tests, and smoke tests. Use this in CI/CD pipelines.

### Watch Mode

```bash
npm run test:watch
```

Runs tests in watch mode for development.

### Coverage

```bash
npm run test:coverage
```

Generates test coverage report.

## Mocking for Local Development

### MSW (Mock Service Worker)

The project uses MSW for API mocking during local development.

**Enable Mocks:**

Set `VITE_ENABLE_DEV_MOCKS=true` in your `.env` file.

**Mock Handlers:**

Mock handlers are defined in `mocks/handlers.ts` with realistic responses for all resources.

**Usage:**

1. Start the app: `npm run dev`
2. Mocks are automatically enabled if `VITE_ENABLE_DEV_MOCKS=true`
3. All API calls are intercepted by MSW and return mock data

**Benefits:**

- Develop UI without backend dependency
- Test error scenarios easily
- Consistent test data
- Faster development cycle

## Generating Types from OpenAPI

If an OpenAPI/Swagger specification exists, you can generate TypeScript types:

### Using openapi-typescript

```bash
npx openapi-typescript api-spec/openapi.yaml -o src/types/generated/api.ts
```

### Using openapi-generator

```bash
npx @openapitools/openapi-generator-cli generate \
  -i api-spec/openapi.yaml \
  -g typescript-axios \
  -o src/services/api/generated
```

### Manual Types

If no OpenAPI spec exists, types are manually defined in `src/types/*.ts`. The OpenAPI spec in `api-spec/openapi.yaml` documents all endpoints but may not be complete.

## Query Key Naming

All React Query keys follow a consistent pattern defined in `src/services/api/queryKeys.ts`:

### Pattern

```typescript
["<resource>", params]
```

### Examples

```typescript
// Dashboard
queryKeys.dashboard.all // ["dashboard"]

// Customers
queryKeys.customers.list({ page: 1 }) // ["customers", { page: 1 }]
queryKeys.customers.detail("123") // ["customers", "123"]

// Finances
queryKeys.finances.clientPayments.list({ page: 1 }) // ["client-payments", { page: 1 }]
queryKeys.finances.trainerSalaries.list({ month: 1, year: 2024 }) // ["trainer-salaries", { month: 1, year: 2024 }]
```

### Usage

```typescript
import { queryKeys } from '@/services/api/queryKeys';

// In useQuery
const { data } = useQuery({
  queryKey: queryKeys.customers.list({ page: 1 }),
  queryFn: () => fetchCustomersList({ page: 1 }),
});

// In invalidateQueries
queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
```

## Mutation Patterns

### Standard Mutation Pattern

All mutations follow this pattern:

```typescript
const mutation = useMutation({
  mutationFn: createCustomer,
  onSuccess: (data) => {
    // Invalidate queries to refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    
    // OR update cache optimistically
    queryClient.setQueryData(queryKeys.customers.detail(data.id), data);
  },
  onError: (error) => {
    // Handle error (toast, etc.)
    toast.create({ title: 'Error', description: error.message, status: 'error' });
  },
});
```

### Optimistic Updates

For better UX, use optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: updateCustomer,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(newData.id) });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.customers.detail(newData.id));
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.customers.detail(newData.id), newData);
    
    // Return context for rollback
    return { previous };
  },
  onError: (error, newData, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(queryKeys.customers.detail(newData.id), context.previous);
    }
  },
  onSettled: (data, error, newData) => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(newData.id) });
  },
});
```

## Retry Logic

### Automatic Retries

- **Idempotent Requests (GET, HEAD, OPTIONS)**: Automatically retried up to 3 times with exponential backoff on network errors
- **Non-Idempotent Requests (POST, PUT, DELETE)**: No automatic retries unless `idempotency-key` header is present

### Rate Limiting

- **429 Too Many Requests**: Automatically respects `Retry-After` header
- **Max Retry Delay**: 60 seconds
- **Only for Idempotent Methods**: POST/PUT/DELETE only retry if `idempotency-key` header is present

### Exponential Backoff

Retry delays use exponential backoff with jitter:

- Attempt 1: ~1s + jitter
- Attempt 2: ~2s + jitter
- Attempt 3: ~4s + jitter

## Structured Logging

All API errors are logged with structured data:

```typescript
{
  level: 'error',
  type: 'api_error',
  timestamp: '2024-01-01T00:00:00.000Z',
  url: '/dashboard',
  method: 'GET',
  status: 500,
  gymId: 'gym123',
  message: 'Internal server error',
  code: 'API_FAIL'
}
```

Logs are output to console. Can be extended to send to Sentry, DataDog, or other monitoring services.

## Versioning

### Client Version

The client version is automatically included in all requests via the `X-Client-Version` header. This allows the backend to:
- Track client versions
- Log version-specific issues
- Potentially support version-specific endpoints

### API Version

The API version can be configured via `VITE_API_VERSION` environment variable and is included in the `API-Version` header.

## Best Practices

1. **Always use `queryKeys` factory** for React Query keys
2. **Use `ApiError` for error handling** - never throw plain `Error`
3. **Invalidate queries after mutations** to keep UI in sync
4. **Use optimistic updates** for better UX on mutations
5. **Handle errors gracefully** - show user-friendly messages
6. **Log errors with context** - include URL, method, gymId
7. **Test with mocks** during development
8. **Verify contracts** before deploying

## Troubleshooting

### Token Refresh Loops

If you see infinite token refresh loops:
- Check that `_retry` flag is being set correctly
- Verify refresh token is valid
- Check gymId consistency

### 404 Errors

If endpoints return 404:
- Verify base URL is correct
- Check endpoint path matches backend
- Ensure API version is correct

### Rate Limiting

If you hit rate limits:
- Check `Retry-After` header is being respected
- Verify retry logic is only for idempotent methods
- Consider implementing request throttling

## Additional Resources

- [OpenAPI Specification](./api-spec/openapi.yaml)
- [API Types](./src/services/api/types.ts)
- [Query Keys](./src/services/api/queryKeys.ts)
- [Monitoring Utils](./src/utils/monitoring.ts)

