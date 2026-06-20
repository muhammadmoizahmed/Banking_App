import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://127.0.0.1:8000';
}

const BASE_URL = getBaseUrl();

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image?: string;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  login: async (accessToken, refreshToken, user) => {
    set({
      user,
      isAuthenticated: true,
      accessToken,
      refreshToken,
    });
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },

  logout: async () => {
    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
  },

  initAuth: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
        AsyncStorage.getItem('user'),
      ]);

      if (accessToken && refreshToken && userStr) {
        set({
          user: JSON.parse(userStr),
          isAuthenticated: true,
          accessToken,
          refreshToken,
        });
      } else {
        set({ isAuthenticated: false });
      }
    } catch (e) {
      console.error('Failed to load auth state:', e);
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
