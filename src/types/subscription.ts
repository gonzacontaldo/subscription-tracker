// src/types/subscription.ts

export type BillingCycle = 'monthly' | 'yearly';
export type CurrencyCode = 'USD' | 'CAD';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: CurrencyCode;
  category: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextPaymentDate: string;
  notes?: string;
}

// Temporary mock data
export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    price: 15.99,
    currency: 'USD',
    category: 'Streaming',
    billingCycle: 'monthly',
    startDate: '2025-01-01',
    nextPaymentDate: '2025-10-01',
  },
  {
    id: '2',
    name: 'Spotify',
    price: 9.99,
    currency: 'USD',
    category: 'Music',
    billingCycle: 'monthly',
    startDate: '2025-01-15',
    nextPaymentDate: '2025-10-15',
  },
  {
    id: '3',
    name: 'iCloud Storage',
    price: 2.99,
    currency: 'USD',
    category: 'Cloud Storage',
    billingCycle: 'monthly',
    startDate: '2025-02-01',
    nextPaymentDate: '2025-10-01',
  },
];
