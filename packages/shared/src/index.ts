// ─── User & Auth ─────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  INFLUENCER = 'INFLUENCER',
  PUBLIC = 'PUBLIC',
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// ─── Business ────────────────────────────────────────────────────────────────

export enum BusinessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface Business {
  _id: string;
  ownerId: string;
  owner?: User;
  influencerId?: string;
  influencer?: User;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
}

// ─── Canonical Naming Layer ───────────────────────────────────────────────────

export enum CanonicalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVIEW = 'REVIEW',
}

export enum VariationStatus {
  PENDING = 'PENDING',
  LINKED = 'LINKED',
  REJECTED = 'REJECTED',
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

export interface CanonicalItem {
  _id: string;
  name: string;        // Clean English name: "Potato"
  slug: string;
  description?: string;
  categoryId: string;
  category?: Category;
  status: CanonicalStatus;
  variationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemVariation {
  _id: string;
  rawInput: string;          // What user typed: "allu"
  normalizedForm: string;    // AI normalized: "potato"
  language?: string;         // Detected language: "ur", "hi", "en"
  confidence?: number;       // AI confidence: 0.0 - 1.0
  canonicalId?: string;
  canonical?: CanonicalItem;
  status: VariationStatus;
  createdAt: string;
}

// ─── Items / Inventory ────────────────────────────────────────────────────────

export enum ItemStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ItemImportSource {
  MANUAL = 'MANUAL',
  EXCEL = 'EXCEL',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
}

export interface Item {
  _id: string;
  businessId: string;
  business?: Business;
  canonicalId?: string;
  canonical?: CanonicalItem;
  rawName: string;       // Original user input
  displayName: string;   // Shown publicly (canonical name if linked)
  price: number;
  unit?: string;
  stock?: number;
  imageUrl?: string;
  importSource: ItemImportSource;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  rawName: string;
  price: number;
  unit?: string;
  stock?: number;
  imageUrl?: string;
}

export interface AiImportPreview {
  rawInput: string;
  suggestedName: string;
  suggestedCategory?: string;
  canonicalMatch?: CanonicalItem;
  confidence: number;
  price?: number;
  unit?: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  items: Item[];
  total: number;
  query: string;
  normalizedQuery: string;
  page: number;
  limit: number;
}

export interface SearchQuery {
  q: string;
  city?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface NormalizeTextRequest {
  text: string;
}

export interface NormalizeTextResponse {
  original: string;
  normalized: string;
  language: string;
  confidence: number;
  suggestions: string[];
}

export interface ImageImportRequest {
  imageUrl: string;
  businessId: string;
}

export interface VoiceImportRequest {
  audioUrl: string;
  businessId: string;
}

export interface AiImportResponse {
  items: AiImportPreview[];
  rawText?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  MERGE = 'MERGE',
  SPLIT = 'SPLIT',
  LINK = 'LINK',
}

export interface AuditLog {
  _id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  createdAt: string;
}
