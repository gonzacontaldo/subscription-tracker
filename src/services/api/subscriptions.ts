import { apiClient } from './client';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom';

export interface RemoteSubscription {
  id: string;
  userId: string;
  name: string;
  iconKey?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  billingCycle: BillingCycle;
  startDate?: string | null;
  nextPaymentDate?: string | null;
  notes?: string | null;
  reminderDaysBefore?: number | null;
  notificationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayload {
  name: string;
  iconKey?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  billingCycle: BillingCycle;
  startDate?: string | null;
  nextPaymentDate?: string | null;
  notes?: string | null;
  reminderDaysBefore?: number | null;
  notificationId?: string | null;
}

export async function listSubscriptions(): Promise<RemoteSubscription[]> {
  const { data, error } = await apiClient.request<RemoteSubscription[]>('/subscriptions');
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getSubscription(id: string): Promise<RemoteSubscription | null> {
  const { data, error, status } = await apiClient.request<RemoteSubscription>(
    `/subscriptions/${id}`,
  );
  if (status === 404) {
    return null;
  }
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function createSubscription(
  input: SubscriptionPayload,
): Promise<RemoteSubscription> {
  const { data, error } = await apiClient.request<RemoteSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (error || !data) {
    throw error ?? new Error('Failed to create subscription');
  }
  return data;
}

export async function updateSubscriptionRemote(
  id: string,
  input: SubscriptionPayload,
): Promise<RemoteSubscription> {
  const { data, error } = await apiClient.request<RemoteSubscription>(
    `/subscriptions/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );

  if (error || !data) {
    throw error ?? new Error('Failed to update subscription');
  }
  return data;
}

export async function deleteSubscriptionRemote(id: string): Promise<void> {
  const { error } = await apiClient.request<null>(`/subscriptions/${id}`, {
    method: 'DELETE',
  });
  if (error) {
    throw error;
  }
}
