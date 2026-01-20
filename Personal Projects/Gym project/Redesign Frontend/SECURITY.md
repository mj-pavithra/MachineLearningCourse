# Security Documentation

## Authentication Flow

### Login Process

1. User submits credentials via `POST /admin/admin-management/login`
2. Server validates credentials and returns:
   - `idToken` (JWT access token)
   - `refreshToken` (for token refresh)
   - User information (including `isAdmin` flag and `gymId`)
3. Client stores tokens in `localStorage`
4. Client decodes JWT to extract user info and `gymId`

### Token Validation

All protected endpoints require a valid JWT token in the `x-auth-token` header. The request interceptor:

1. **Validates token presence** - Blocks requests without tokens on protected endpoints
2. **Validates token structure** - Ensures token is a valid JWT (3 parts separated by dots)
3. **Validates token expiration** - Checks `exp` claim and rejects expired tokens
4. **Extracts gymId** - Always extracts `gymId` from token (never trusts stored values)
5. **Validates admin role** - Checks `isAdmin` flag for admin-only endpoints

### Token Refresh

When a request receives a 401 Unauthorized response:

1. Client attempts to refresh token using `POST /admin/admin-management/refresh-token`
2. Refresh token is validated on server
3. New tokens are issued (token rotation)
4. Original request is retried with new token
5. If refresh fails, user is logged out and redirected to sign-in

### Logout Process

1. Client calls `POST /admin/admin-management/logout` to revoke session on server
2. Server invalidates the session/token
3. Client clears local tokens from `localStorage`
4. Client clears all caches and Zustand stores
5. User is redirected to sign-in page

## Authorization Rules

### Role-Based Access Control (RBAC)

#### Admin-Only Endpoints

The following endpoints require the `isAdmin` flag to be `true` in the JWT token:

- `/admin/admin-management/dashboard`
- `/admin/admin-management/getAllMembers`
- `/admin/admin-management/sessions`
- `/admin/admin-management/sessions/{tokenId}/revoke`
- `/admin/admin-management/sessions/revoke-all`
- `/admin/admin-management/logout`
- `/admin/admin-management/change-password`
- All other `/admin/admin-management/*` endpoints (except login, register, forgot-password, reset-password)

#### Route Protection

- Use `<ProtectedRoute>` component for authenticated routes
- Use `<ProtectedRoute requireAdmin>` for admin-only routes
- Use `useRequireAdmin()` hook in components that need admin checks

### Multi-Tenant Security

#### GymId Validation

All multi-tenant endpoints enforce `gymId` validation:

1. `gymId` is extracted from JWT token (never trusted from request body/params)
2. `gym-id` header is added to requests for endpoints that require it
3. Cross-tenant access attempts are blocked and logged as security violations
4. GymId mismatches trigger security alerts

#### Protected Multi-Tenant Endpoints

- `/customers/*`
- `/sessions/*`
- `/clientsPayment/*`
- `/packages/get-all`
- `/equipments`
- `/api/groups`

## Input Validation

### Request Payload Validation

All request payloads are validated using Zod schemas before sending to API:

- Email format validation
- Password strength requirements (min 8 characters)
- Phone number format validation
- NIC (Sri Lankan National ID) format validation
- String sanitization (XSS prevention)
- Type checking and required field validation

### URL Parameter Validation

- Path parameters (IDs) are validated for format
- Query parameters (page numbers, dates) are validated
- Malformed parameters are rejected with clear error messages

## Error Handling Security

### Error Message Sanitization

Error messages are sanitized in production to prevent information leakage:

- Stack traces are removed
- File paths are obfuscated
- Generic messages for authentication failures ("Invalid email or password" instead of "User not found")
- Sensitive internal error codes are removed
- Message length is limited to 200 characters

### Security Event Logging

The following security events are logged:

- **Authentication failures** - Failed login attempts
- **Authorization failures** - Non-admin users accessing admin endpoints
- **Security violations** - Missing tokens on protected endpoints
- **Suspicious activity** - Token tampering, gymId mismatches, multiple failed attempts
- **Admin actions** - All admin operations for audit trail

## Token Security

### Token Storage

- Tokens are stored in `localStorage` (client-side)
- Consider httpOnly cookies for enhanced security (requires backend changes)
- Tokens are cleared on logout and browser close (if `rememberMe` is false)

### Token Rotation

- Refresh tokens are rotated on each refresh
- Old refresh tokens are invalidated
- Prevents token reuse attacks

### Token Expiration

- Access tokens have expiration time (`exp` claim)
- Expired tokens trigger automatic refresh
- If refresh fails, user is logged out

## Security Headers

All API requests include:

- `X-Client-Version` - Client application version
- `API-Version` - API version
- `X-Requested-With: XMLHttpRequest` - CSRF protection indicator
- `x-auth-token` - JWT access token (for authenticated requests)
- `gym-id` - Gym identifier (for multi-tenant endpoints)

## Best Practices

### For Developers

1. **Always validate inputs** - Use Zod schemas from `src/services/api/input-validators.ts`
2. **Use ProtectedRoute** - Wrap authenticated routes with `<ProtectedRoute>`
3. **Check admin role** - Use `useRequireAdmin()` hook for admin-only features
4. **Sanitize errors** - Use `getErrorMessage()` utility for user-facing errors
5. **Log security events** - Use monitoring utilities for security logging
6. **Never trust client data** - Always validate and sanitize user inputs
7. **Extract gymId from token** - Never trust gymId from request body/params

### For Security Audits

1. Review security logs regularly
2. Monitor authentication failures
3. Check for suspicious activity patterns
4. Audit admin actions
5. Review token refresh patterns
6. Monitor cross-tenant access attempts

## Session Management

### Active Sessions

Users can view and manage active sessions:

- `GET /admin/admin-management/sessions` - List all active sessions
- `POST /admin/admin-management/sessions/{tokenId}/revoke` - Revoke specific session
- `POST /admin/admin-management/sessions/revoke-all` - Revoke all sessions

### Session Revocation

- Sessions are revoked on logout
- Revoked sessions cannot be used for API calls
- Users are automatically logged out if their session is revoked

## API Endpoint Security Classification

### Public Endpoints (No Authentication Required)

- `POST /admin/admin-management/login`
- `POST /admin/admin-management/refresh-token`
- `POST /admin/admin-management/forgot-password`
- `PATCH /admin/admin-management/reset-password`
- `POST /admin/admin-management/register`

### Authenticated Endpoints (Require Valid Token)

All other endpoints require a valid JWT token.

### Admin-Only Endpoints (Require Admin Role)

See "Admin-Only Endpoints" section above.

### Multi-Tenant Endpoints (Require gymId Validation)

See "Protected Multi-Tenant Endpoints" section above.

