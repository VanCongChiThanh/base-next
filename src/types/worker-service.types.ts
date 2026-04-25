export enum ServiceType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BOTH = 'BOTH',
}

export interface WorkerService {
  id: string;
  workerId: string;
  worker?: Record<string, any>;
  categoryId: string;
  category?: Record<string, any>;
  title: string;
  description: string;
  skillIds: string[];
  startTime: string;
  endTime: string;
  recurring?: string;
  price: number;
  priceType: 'HOURLY' | 'FIXED';
  isNegotiable: boolean;
  provinceCode?: string;
  wardCode?: string;
  radiusKm?: number;
  type: ServiceType;
  portfolioUrls: string[];
  isAvailableNow: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerServiceRequest {
  categoryId: string;
  title: string;
  description: string;
  skillIds?: string[];
  startTime: string;
  endTime: string;
  recurring?: string;
  price: number;
  priceType?: 'HOURLY' | 'FIXED';
  isNegotiable?: boolean;
  provinceCode?: string;
  wardCode?: string;
  radiusKm?: number;
  type?: ServiceType;
  portfolioUrls?: string[];
  isAvailableNow?: boolean;
}

export interface WorkerServiceFilterParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  provinceCode?: string;
  wardCode?: string;
  search?: string;
  type?: ServiceType;
  isAvailableNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
