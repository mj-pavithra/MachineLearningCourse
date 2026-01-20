import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UserSession, LoginRequest } from '@/types/auth';
import { authApi } from '@/services/api/auth';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';
import { clearAllCaches } from '@/services/cache/localStorageCache';
import { clearAllStores } from '@/stores';

interface AuthContextType {
  user: UserSession | null;
  session: { user: UserSession; token: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // Alias for isLoading for ProtectedRoute compatibility
  login: (data: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      // SECURITY: Revoke session on server before clearing local tokens
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        try {
          await authApi.logout();
        } catch (error) {
          // Even if logout API fails, continue with local cleanup
          console.warn('Logout API call failed, continuing with local cleanup:', error);
        }
      }
    } catch (error) {
      // Continue with cleanup even if logout API fails
      console.warn('Error during logout:', error);
    } finally {
      // Clear tokens (always clear, even if API call failed)
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      // Clear all caches (multi-tenant isolation)
      clearAllCaches();

      // Clear all Zustand stores
      clearAllStores();

      // Reset user state
      setUser(null);
    }
  }, []);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const initializeSession = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (token) {
          const gymId = getGymIdFromToken(token);
          if (gymId) {
            // Decode token to get user info (basic info from token)
            // In a real app, you might want to call an API to get full user details
            const decoded = JSON.parse(atob(token.split('.')[1]));
            
            setUser({
              id: decoded._id || decoded.sub || '',
              name: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
              email: decoded.email || '',
              token,
              refreshToken,
              mobile: decoded.mobile || '',
              isAdmin: decoded.isAdmin || false,
              isFullTime: decoded.isFullTime || false,
              gymId,
              memberId: decoded.memberId,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    // Listen for logout events from axios interceptor
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await authApi.signIn(data);

      if (response.status === 'SUCCESS' && response.data) {
        const { idToken, refreshToken, _id, firstName, lastName, email, mobile, isAdmin, isFullTime, gymId, memberId } = response.data;

        // Store tokens
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, idToken);
        if (refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        // Set user session
        const userSession: UserSession = {
          id: _id,
          name: `${firstName} ${lastName}`.trim(),
          email,
          token: idToken,
          refreshToken: refreshToken || null,
          mobile,
          isAdmin,
          isFullTime,
          gymId,
          memberId,
        };

        setUser(userSession);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Login failed' };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (token && refreshToken) {
        const gymId = getGymIdFromToken(token);
        if (gymId) {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          
          setUser({
            id: decoded._id || decoded.sub || '',
            name: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
            email: decoded.email || '',
            token,
            refreshToken,
            mobile: decoded.mobile || '',
            isAdmin: decoded.isAdmin || false,
            isFullTime: decoded.isFullTime || false,
            gymId,
            memberId: decoded.memberId,
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    session: user ? { user, token: user.token } : null,
    isAuthenticated: !!user,
    isLoading,
    isInitializing: isLoading, // Alias for ProtectedRoute
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

