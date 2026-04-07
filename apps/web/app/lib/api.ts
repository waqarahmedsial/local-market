import { createApiClient, BrowserTokenStorage } from '@local-market/api-client';

const API_BASE_URL = typeof window !== 'undefined'
  ? (window.ENV?.API_URL ?? 'http://localhost:3001/api/v1')
  : (process.env.API_URL ?? 'http://localhost:3001/api/v1');

export const tokenStorage = new BrowserTokenStorage();
export const apiClient = createApiClient(API_BASE_URL, tokenStorage);

declare global {
  interface Window {
    ENV: { API_URL: string };
  }
}
