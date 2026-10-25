import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthResponse, LoginDto, RegisterDto, User } from '../services/auth.service';
import { storageService } from '../services/storage.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginDto) => Promise<AuthResponse>;
  register: (data: RegisterDto) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUserData: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on app boot
    const restoreSession = async () => {
      try {
        const storedToken = await storageService.getToken();
        const storedUser = await storageService.getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.warn('Error restoring auth session', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (data: LoginDto) => {
    const res = await authService.login(data);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const register = async (data: RegisterDto) => {
    const res = await authService.register(data);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUserData = (updated: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updated };
      setUser(merged);
      storageService.setUser(merged);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
