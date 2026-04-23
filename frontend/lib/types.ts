export type ProductStatus = "CREATED" | "IN_TRANSIT" | "DELIVERED" | "SOLD";

export type UserRole = "NONE" | "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER";

export interface Product {
  id: number;
  name: string;
  origin: string;
  batchNumber: string;
  currentOwner: string;
  status: ProductStatus;
  createdAt: number;
}

export interface HistoryEntry {
  actor: string;
  action: string;
  timestamp: number;
}

export interface CertificationEntry {
  cid: string;
  fileName: string;
  timestamp: number;
  uploader: string;
}

export interface DbUser {
  wallet_address: string;
  role: UserRole;
  company_name: string;
  created_at: string;
}

export interface DbProduct {
  id: number;
  name: string;
  description: string;
  origin_country: string;
  batch_number: string;
  created_at: string;
  chain_product_id: number;
  creator_wallet: string;
}

export interface DbEvent {
  id: number;
  product_id: number;
  actor_address: string;
  action: string;
  notes: string;
  created_at: string;
}

export interface WalletState {
  address: string | null;
  role: UserRole;
  isConnected: boolean;
}

export interface VerifyResult {
  exists: boolean;
  currentOwner: string;
  status: ProductStatus;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CreateProductBody {
  name: string;
  description: string;
  origin_country: string;
  batch_number: string;
  chain_product_id: number;
  creator_wallet: string;
}

export interface CreateUserBody {
  wallet_address: string;
  role: UserRole;
  company_name: string;
}

export interface CreateEventBody {
  product_id: number;
  actor_address: string;
  action: string;
  notes: string;
}
