import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as React from 'react';

import {
  createUser,
  getUserByEmail,
  updateUserAvatar,
} from '../db/repositories/users.repo';
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

async function hashPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${normalizedEmail}:${password}`,
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [initializing, setInitializing] = React.useState(true);
  const [lastEmail, setLastEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const [storedUser, storedEmail] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LAST_EMAIL_KEY),
        ]);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedEmail) {
          setLastEmail(storedEmail);
        }
      } catch (error) {
        console.error('Failed to restore auth session', error);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

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

  const login = React.useCallback(
    async (email: string, password: string) => {
      const account = await getUserByEmail(email);
      if (!account) {
        throw new Error('No account found for that email');
      }

      const hashed = await hashPassword(account.email, password);
      if (hashed !== account.passwordHash) {
        throw new Error('Incorrect password');
      }

      const sanitized: User = {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        avatarUri: account.avatarUri,
      };

      await persistUser(sanitized);
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
      const existing = await getUserByEmail(email);
      if (existing) {
        throw new Error('Account already exists for that email');
      }

      const passwordHash = await hashPassword(email, password);
      const newUser = await createUser({
        email,
        passwordHash,
        displayName,
      });

      await persistUser(newUser);
    },
    [persistUser],
  );

  const logout = React.useCallback(async () => {
    await persistUser(null);
    await AsyncStorage.removeItem(LAST_EMAIL_KEY);
    setLastEmail(null);
  }, [persistUser]);

  const switchAccount = React.useCallback(async () => {
    await persistUser(null);
  }, [persistUser]);

  const setAvatar = React.useCallback(
    async (uri: string | null) => {
      if (!user) return;
      await updateUserAvatar(user.id, uri);
      const updated: User = { ...user, avatarUri: uri ?? null };
      await persistUser(updated);
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
