import * as SecureStore from 'expo-secure-store';
import { createApiClient, TokenStorage } from '@local-market/api-client';

const ACCESS_KEY = 'lm_access_token';
const REFRESH_KEY = 'lm_refresh_token';

class SecureTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  }
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  }
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  }
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  }
}

export const tokenStorage = new SecureTokenStorage();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const apiClient = createApiClient(API_BASE_URL, tokenStorage);
