export interface Subscription {
  id?: string;
  name: string;
  iconKey?: string | null;
  category?: string | null;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'custom';
  startDate: string;
  nextPaymentDate: string;
  notes?: string | null;
  reminderDaysBefore?: number;
  notificationId?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
