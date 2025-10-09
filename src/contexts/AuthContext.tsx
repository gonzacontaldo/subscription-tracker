import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

import type { AuthUser } from '../services/api/auth';
import {
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
} from '../services/api/auth';
import type { User } from '../types/user';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  lastEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: () => Promise<void>;
  setAvatar: (uri: string | null) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth:user';
const LAST_EMAIL_KEY = 'auth:last-email';

function toUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName,
    avatarUri: authUser.avatarUri ?? null,
  };
}

async function readStoredUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed?.email) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse stored user', error);
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [initializing, setInitializing] = React.useState(true);
  const [lastEmail, setLastEmail] = React.useState<string | null>(null);

  const persistUser = React.useCallback(async (nextUser: User | null) => {
    if (nextUser) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      await AsyncStorage.setItem(LAST_EMAIL_KEY, nextUser.email);
      setLastEmail(nextUser.email);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    setUser(nextUser);
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        const [storedUser, storedEmail] = await Promise.all([
          readStoredUser(),
          AsyncStorage.getItem(LAST_EMAIL_KEY),
        ]);

        if (storedUser) {
          setUser(storedUser);
          setLastEmail(storedUser.email);
        } else if (storedEmail) {
          setLastEmail(storedEmail);
        }

        try {
          const remoteUser = await fetchCurrentUser();
          if (remoteUser) {
            await persistUser(toUser(remoteUser));
          } else {
            await persistUser(null);
          }
        } catch (error) {
          console.warn('Failed to refresh remote session', error);
        }
      } catch (error) {
        console.error('Failed to restore auth session', error);
      } finally {
        setInitializing(false);
      }
    })();
  }, [persistUser]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const account = await apiLogin({ email, password });
      await persistUser(toUser(account));
    },
    [persistUser],
  );

  const register = React.useCallback(
    async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      const account = await apiRegister({ email, password, displayName });
      await persistUser(toUser(account));
    },
    [persistUser],
  );

  const logout = React.useCallback(async () => {
    await apiLogout();
    await persistUser(null);
    await AsyncStorage.removeItem(LAST_EMAIL_KEY);
    setLastEmail(null);
  }, [persistUser]);

  const switchAccount = React.useCallback(async () => {
    await apiLogout();
    await persistUser(null);
  }, [persistUser]);

  const setAvatar = React.useCallback(
    async (uri: string | null) => {
      if (!user) return;
      const updated = await apiUpdateProfile({ avatarUri: uri });
      await persistUser(toUser(updated));
    },
    [persistUser, user],
  );

  const value = React.useMemo(
    () => ({
      user,
      initializing,
      lastEmail,
      login,
      register,
      logout,
      switchAccount,
      setAvatar,
    }),
    [user, initializing, lastEmail, login, register, logout, switchAccount, setAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
