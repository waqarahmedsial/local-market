import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginDto,
  RegisterDto,
  Business,
  CreateBusinessDto,
  BusinessStatus,
  Item,
  CreateItemDto,
  AiImportPreview,
  AiImportResponse,
  NormalizeTextResponse,
  CanonicalItem,
  ItemVariation,
  VariationStatus,
  Category,
  SearchResult,
  SearchQuery,
  PaginatedResponse,
  AuditLog,
  User,
  CropBuyRequest,
  CreateCropBuyRequestDto,
  CropBuyRequestStatus,
} from '@local-market/shared';

// ─── Token Storage Abstraction ────────────────────────────────────────────────
// Provide platform-specific implementations (localStorage for web, SecureStore for mobile)

export interface TokenStorage {
  getAccessToken(): string | null | Promise<string | null>;
  getRefreshToken(): string | null | Promise<string | null>;
  setTokens(access: string, refresh: string): void | Promise<void>;
  clearTokens(): void | Promise<void>;
}

// ─── API Client Factory ───────────────────────────────────────────────────────

export function createApiClient(baseURL: string, tokenStorage: TokenStorage): ApiClient {
  const http: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  // Attach access token to every request
  http.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Refresh token on 401
  http.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const { data } = await axios.post<ApiResponse<AuthResponse>>(
              `${baseURL}/auth/refresh`,
              { refreshToken },
            );
            if (data.data) {
              await tokenStorage.setTokens(
                data.data.tokens.accessToken,
                data.data.tokens.refreshToken,
              );
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] =
                  `Bearer ${data.data.tokens.accessToken}`;
              }
              return http(originalRequest);
            }
          } catch {
            await tokenStorage.clearTokens();
          }
        }
      }
      return Promise.reject(error);
    },
  );

  return new ApiClient(http, tokenStorage);
}

// ─── API Client ───────────────────────────────────────────────────────────────

export class ApiClient {
  constructor(
    private readonly http: AxiosInstance,
    private readonly tokenStorage: TokenStorage,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  readonly auth = {
    register: async (dto: RegisterDto): Promise<AuthResponse> => {
      const { data } = await this.http.post<ApiResponse<AuthResponse>>('/auth/register', dto);
      if (data.data) {
        await this.tokenStorage.setTokens(
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken,
        );
      }
      return data.data!;
    },

    login: async (dto: LoginDto): Promise<AuthResponse> => {
      const { data } = await this.http.post<ApiResponse<AuthResponse>>('/auth/login', dto);
      if (data.data) {
        await this.tokenStorage.setTokens(
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken,
        );
      }
      return data.data!;
    },

    logout: async (): Promise<void> => {
      await this.tokenStorage.clearTokens();
    },

    me: async (): Promise<User> => {
      const { data } = await this.http.get<ApiResponse<User>>('/auth/me');
      return data.data!;
    },

    refresh: async (refreshToken: string): Promise<AuthResponse> => {
      const { data } = await this.http.post<ApiResponse<AuthResponse>>('/auth/refresh', {
        refreshToken,
      });
      return data.data!;
    },
  };

  // ── Businesses ────────────────────────────────────────────────────────────

  readonly businesses = {
    create: async (dto: CreateBusinessDto): Promise<Business> => {
      const { data } = await this.http.post<ApiResponse<Business>>('/businesses', dto);
      return data.data!;
    },

    list: async (params?: {
      status?: BusinessStatus;
      influencerId?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<Business>> => {
      const { data } = await this.http.get<ApiResponse<PaginatedResponse<Business>>>(
        '/businesses',
        { params },
      );
      return data.data!;
    },

    getById: async (id: string): Promise<Business> => {
      const { data } = await this.http.get<ApiResponse<Business>>(`/businesses/${id}`);
      return data.data!;
    },

    update: async (id: string, dto: Partial<CreateBusinessDto>): Promise<Business> => {
      const { data } = await this.http.patch<ApiResponse<Business>>(`/businesses/${id}`, dto);
      return data.data!;
    },

    approve: async (id: string): Promise<Business> => {
      const { data } = await this.http.patch<ApiResponse<Business>>(`/businesses/${id}/approve`);
      return data.data!;
    },

    reject: async (id: string, reason: string): Promise<Business> => {
      const { data } = await this.http.patch<ApiResponse<Business>>(`/businesses/${id}/reject`, {
        reason,
      });
      return data.data!;
    },

    assignInfluencer: async (businessId: string, influencerId: string): Promise<Business> => {
      const { data } = await this.http.patch<ApiResponse<Business>>(
        `/businesses/${businessId}/assign-influencer`,
        { influencerId },
      );
      return data.data!;
    },

    myBusiness: async (): Promise<Business> => {
      const { data } = await this.http.get<ApiResponse<Business>>('/businesses/my');
      return data.data!;
    },
  };

  // ── Items ─────────────────────────────────────────────────────────────────

  readonly items = {
    create: async (businessId: string, dto: CreateItemDto): Promise<Item> => {
      const { data } = await this.http.post<ApiResponse<Item>>(
        `/businesses/${businessId}/items`,
        dto,
      );
      return data.data!;
    },

    list: async (
      businessId: string,
      params?: { page?: number; limit?: number; status?: string },
    ): Promise<PaginatedResponse<Item>> => {
      const { data } = await this.http.get<ApiResponse<PaginatedResponse<Item>>>(
        `/businesses/${businessId}/items`,
        { params },
      );
      return data.data!;
    },

    update: async (itemId: string, dto: Partial<CreateItemDto>): Promise<Item> => {
      const { data } = await this.http.patch<ApiResponse<Item>>(`/items/${itemId}`, dto);
      return data.data!;
    },

    delete: async (itemId: string): Promise<void> => {
      await this.http.delete(`/items/${itemId}`);
    },

    bulkCreate: async (businessId: string, previews: AiImportPreview[]): Promise<Item[]> => {
      const { data } = await this.http.post<ApiResponse<Item[]>>(
        `/businesses/${businessId}/items/bulk`,
        { items: previews },
      );
      return data.data!;
    },
  };

  // ── AI ────────────────────────────────────────────────────────────────────

  readonly ai = {
    normalizeText: async (text: string): Promise<NormalizeTextResponse> => {
      const { data } = await this.http.post<ApiResponse<NormalizeTextResponse>>('/ai/normalize', {
        text,
      });
      return data.data!;
    },

    importFromText: async (text: string, businessId: string): Promise<AiImportResponse> => {
      const { data } = await this.http.post<ApiResponse<AiImportResponse>>('/ai/import/text', {
        text,
        businessId,
      });
      return data.data!;
    },

    importFromImage: async (imageUrl: string, businessId: string): Promise<AiImportResponse> => {
      const { data } = await this.http.post<ApiResponse<AiImportResponse>>('/ai/import/image', {
        imageUrl,
        businessId,
      });
      return data.data!;
    },

    importFromVoice: async (audioUrl: string, businessId: string): Promise<AiImportResponse> => {
      const { data } = await this.http.post<ApiResponse<AiImportResponse>>('/ai/import/voice', {
        audioUrl,
        businessId,
      });
      return data.data!;
    },
  };

  // ── Canonical ─────────────────────────────────────────────────────────────

  readonly canonical = {
    list: async (params?: {
      status?: string;
      categoryId?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<CanonicalItem>> => {
      const { data } = await this.http.get<ApiResponse<PaginatedResponse<CanonicalItem>>>(
        '/canonical',
        { params },
      );
      return data.data!;
    },

    create: async (dto: {
      name: string;
      categoryId: string;
      description?: string;
    }): Promise<CanonicalItem> => {
      const { data } = await this.http.post<ApiResponse<CanonicalItem>>('/canonical', dto);
      return data.data!;
    },

    getById: async (id: string): Promise<CanonicalItem> => {
      const { data } = await this.http.get<ApiResponse<CanonicalItem>>(`/canonical/${id}`);
      return data.data!;
    },

    update: async (
      id: string,
      dto: { name?: string; description?: string; status?: string },
    ): Promise<CanonicalItem> => {
      const { data } = await this.http.patch<ApiResponse<CanonicalItem>>(`/canonical/${id}`, dto);
      return data.data!;
    },

    merge: async (sourceId: string, targetId: string): Promise<CanonicalItem> => {
      const { data } = await this.http.post<ApiResponse<CanonicalItem>>(
        `/canonical/${sourceId}/merge`,
        { targetId },
      );
      return data.data!;
    },

    variations: {
      list: async (
        canonicalId: string,
        params?: { status?: VariationStatus; page?: number; limit?: number },
      ): Promise<PaginatedResponse<ItemVariation>> => {
        const { data } = await this.http.get<ApiResponse<PaginatedResponse<ItemVariation>>>(
          `/canonical/${canonicalId}/variations`,
          { params },
        );
        return data.data!;
      },

      pendingAll: async (): Promise<ItemVariation[]> => {
        const { data } =
          await this.http.get<ApiResponse<ItemVariation[]>>('/canonical/variations/pending');
        return data.data!;
      },

      approve: async (variationId: string, canonicalId: string): Promise<ItemVariation> => {
        const { data } = await this.http.patch<ApiResponse<ItemVariation>>(
          `/canonical/variations/${variationId}/approve`,
          { canonicalId },
        );
        return data.data!;
      },

      reject: async (variationId: string): Promise<ItemVariation> => {
        const { data } = await this.http.patch<ApiResponse<ItemVariation>>(
          `/canonical/variations/${variationId}/reject`,
        );
        return data.data!;
      },
    },
  };

  // ── Categories ────────────────────────────────────────────────────────────

  readonly categories = {
    list: async (): Promise<Category[]> => {
      const { data } = await this.http.get<ApiResponse<Category[]>>('/categories');
      return data.data!;
    },

    create: async (dto: { name: string; parentId?: string }): Promise<Category> => {
      const { data } = await this.http.post<ApiResponse<Category>>('/categories', dto);
      return data.data!;
    },
  };

  // ── Search ────────────────────────────────────────────────────────────────

  readonly search = {
    items: async (query: SearchQuery): Promise<SearchResult> => {
      const { data } = await this.http.get<ApiResponse<SearchResult>>('/search', {
        params: query,
      });
      return data.data!;
    },
  };

  // ── Audit Logs ────────────────────────────────────────────────────────────

  readonly audit = {
    list: async (params?: {
      entity?: string;
      entityId?: string;
      userId?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<AuditLog>> => {
      const { data } = await this.http.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit', {
        params,
      });
      return data.data!;
    },
  };

  // ── Crop Buy Requests ─────────────────────────────────────────────────────

  readonly cropBuyRequests = {
    create: async (dto: CreateCropBuyRequestDto): Promise<CropBuyRequest> => {
      const { data } = await this.http.post<ApiResponse<CropBuyRequest>>('/crop-requests', dto);
      return data.data!;
    },

    list: async (params?: {
      city?: string;
      cropName?: string;
      status?: CropBuyRequestStatus;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<CropBuyRequest>> => {
      const { data } = await this.http.get<ApiResponse<PaginatedResponse<CropBuyRequest>>>(
        '/crop-requests',
        { params },
      );
      return data.data!;
    },

    getById: async (id: string): Promise<CropBuyRequest> => {
      const { data } = await this.http.get<ApiResponse<CropBuyRequest>>(`/crop-requests/${id}`);
      return data.data!;
    },

    updateStatus: async (id: string, status: CropBuyRequestStatus): Promise<CropBuyRequest> => {
      const { data } = await this.http.patch<ApiResponse<CropBuyRequest>>(
        `/crop-requests/${id}/status`,
        { status },
      );
      return data.data!;
    },

    delete: async (id: string): Promise<void> => {
      await this.http.delete(`/crop-requests/${id}`);
    },
  };
}

// ─── Browser Token Storage (for Remix/web) ───────────────────────────────────

export class BrowserTokenStorage implements TokenStorage {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lm_access_token');
  }
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lm_refresh_token');
  }
  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lm_access_token', access);
    localStorage.setItem('lm_refresh_token', refresh);
  }
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('lm_access_token');
    localStorage.removeItem('lm_refresh_token');
  }
}
