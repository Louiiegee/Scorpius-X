/**
 * Auth change hook
 * Listens for authentication state changes and provides user data
 */

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { logger } from '@/config/env';
import type { User } from '@/types/generated';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useAuthChange() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = await authService.getCurrentUser();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.error('Failed to initialize auth:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const handleAuthLogin = async (event: CustomEvent) => {
      try {
        const user = event.detail || await authService.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        logger.info('User logged in:', user.username);
      } catch (error) {
        logger.error('Auth login event failed:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    };

    const handleAuthLogout = () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      logger.info('User logged out');
    };

    const handleAuthError = (event: CustomEvent) => {
      const error = event.detail || new Error('Authentication error');
      setAuthState(prev => ({
        ...prev,
        error,
        isLoading: false,
      }));
      logger.error('Auth error:', error);
    };

    const handleTokenRefresh = async (event: CustomEvent) => {
      try {
        const user = event.detail || await authService.getCurrentUser();
        setAuthState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          error: null,
        }));
        logger.debug('Token refreshed, user updated');
      } catch (error) {
        logger.error('Token refresh failed:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    // Add event listeners
    window.addEventListener('auth:login', handleAuthLogin as EventListener);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:error', handleAuthError as EventListener);
    window.addEventListener('auth:refresh', handleTokenRefresh as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('auth:login', handleAuthLogin as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:error', handleAuthError as EventListener);
      window.removeEventListener('auth:refresh', handleTokenRefresh as EventListener);
    };
  }, []);

  // Login function
  const login = async (username: string, password: string, rememberMe?: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login({ username, password, rememberMe });

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Emit login event
      window.dispatchEvent(new CustomEvent('auth:login', { detail: response.user }));

      return response;
    } catch (error) {
      const authError = error as Error;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));

      // Emit error event
      window.dispatchEvent(new CustomEvent('auth:error', { detail: authError }));

      throw authError;
    }
  };

  // Logout function
  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await authService.logout();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Emit logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      logger.error('Logout failed:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error as Error,
      });

      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!authState.isAuthenticated) return;

    try {
      const user = await authService.getCurrentUser();
      setAuthState(prev => ({ ...prev, user }));
      return user;
    } catch (error) {
      logger.error('Failed to refresh user:', error);
      // If refresh fails, user might need to re-login
      await logout();
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshUser,
  };
}

// Higher-order component for auth protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuthChange();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}