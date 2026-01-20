import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { getIsAdminFromToken } from '@/utils/jwt';

/**
 * Hook to enforce admin role requirement
 * Redirects non-admin users to an unauthorized page or dashboard
 * 
 * @example
 * ```typescript
 * function AdminPage() {
 *   useRequireAdmin();
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export function useRequireAdmin() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.token) {
      // Not authenticated - redirect to sign in
      navigate('/sign-in', { replace: true });
      return;
    }

    const isAdmin = getIsAdminFromToken(session.token);
    if (!isAdmin) {
      // Not admin - redirect to unauthorized page or dashboard
      console.warn('[useRequireAdmin] Non-admin user attempted to access admin-only page');
      navigate('/unauthorized', { replace: true });
    }
  }, [session, navigate]);
}

/**
 * Check if current user is admin
 * @returns boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  const { session } = useAuth();
  
  if (!session?.token) {
    return false;
  }

  return getIsAdminFromToken(session.token);
}

