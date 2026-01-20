import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, Center } from '@chakra-ui/react';
import { getGymIdFromToken, getIsAdminFromToken } from '@/utils/jwt';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, isInitializing } = useAuth();
  const location = useLocation();

  // Still initializing session (e.g. reading localStorage) -> show loader
  if (isInitializing) {
    return (
      <Center h="100vh" aria-busy="true">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!session?.token) {
    // Redirect to sign-in with intended path
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  // Additional multi-tenant safety: ensure gymId present in token
  const gymId = getGymIdFromToken(session.token);
  if (!gymId) {
    // Token is invalid or missing gymId - redirect to sign-in
    console.warn('ProtectedRoute: Token missing gymId, redirecting to sign-in');
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  // SECURITY: Enforce admin role if required
  if (requireAdmin) {
    const isAdmin = getIsAdminFromToken(session.token);
    if (!isAdmin) {
      console.warn('ProtectedRoute: Non-admin user attempted to access admin-only route');
      return <Navigate to="/unauthorized" replace state={{ from: location }} />;
    }
  }

  return children;
}


