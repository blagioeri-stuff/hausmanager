export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'system' | 'scraper' | 'scheduler' | 'notification' | 'settings';
export type DetectionMethod = 'jsonld' | 'meta' | 'profile' | 'generic' | 'claude' | 'manual' | 'failed';
export type NotificationChannel = 'email' | 'telegram';

export interface PriceData {
  price: number;
  currency: string;
  productName?: string | null;
  availability: boolean;
}

export interface DetectionResult {
  price: number | null;
  currency: string;
  productName: string | null;
  availability: boolean;
  method: DetectionMethod;
  shopName?: string | null;
  error?: string;
}

export interface PageData {
  html: string;
  title: string;
  url: string;
}

export interface SwissImportCost {
  totalWithoutDuty: number;
  estimatedDuty: number;
  estimatedVat: number;
  totalWithDuty: number;
  dutyApplies: boolean;
}
