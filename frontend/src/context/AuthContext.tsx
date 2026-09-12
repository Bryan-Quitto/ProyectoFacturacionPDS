import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { postApiV1AuthLogin } from '../api/generated/posApi';
import type { LoginRequestDto, LoginResponseDto } from '../api/generated/model';
import { setAuthToken } from '../api/custom-fetch';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: 'Vendedor';
}

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequestDto) => Promise<void>;
  logout: () => void;
}

const USER_STORAGE_KEY = 'pos.auth.user';
const TOKEN_STORAGE_KEY = 'pos.auth.token';

const getInitialAuthState = (): { token: string | null; user: AuthUser | null } => {
  try {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken && storedUserRaw) {
      const parsedUser = JSON.parse(storedUserRaw) as AuthUser;
      return {
        token: storedToken,
        user: {
          ...parsedUser,
          role: 'Vendedor',
        },
      };
    }
  } catch {
    // Storage access failure or corrupt JSON
  }
  return { token: null, user: null };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{ token: string | null; user: AuthUser | null }>(
    () => getInitialAuthState()
  );
  const isLoading = false;

  const login = useCallback(async (credentials: LoginRequestDto): Promise<void> => {
    const response = await postApiV1AuthLogin(credentials);

    // Handle response.data according to the API contract
    const responsePayload = 'data' in response ? response.data : (response as unknown as LoginResponseDto);

    if (!responsePayload || !('token' in responsePayload)) {
      throw new Error('La respuesta de autenticación no contiene un token válido.');
    }

    const token = responsePayload.token;
    const user: AuthUser = {
      id: responsePayload.userId,
      username: responsePayload.username,
      fullName: responsePayload.fullName,
      role: 'Vendedor',
    };

    setAuthToken(token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    setAuthState({
      token,
      user,
    });
  }, []);

  const logout = useCallback((): void => {
    setAuthToken(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage errors on logout
    }
    setAuthState({
      token: null,
      user: null,
    });
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    token: authState.token,
    user: authState.user,
    isAuthenticated: Boolean(authState.token && authState.user),
    isLoading,
    login,
    logout,
  }), [authState.token, authState.user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider.');
  }
  return context;
};
