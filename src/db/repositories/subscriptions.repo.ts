import {
  createSubscription,
  deleteSubscriptionRemote,
  getSubscription,
  listSubscriptions,
  updateSubscriptionRemote,
  type RemoteSubscription,
  type SubscriptionPayload,
} from '../../services/api/subscriptions';
import type { Subscription } from '../../types/subscription';

function fromRemote(remote: RemoteSubscription): Subscription {
  const fallbackDate = new Date().toISOString();
  const startDate = remote.startDate ?? fallbackDate;
  const nextPaymentDate = remote.nextPaymentDate ?? startDate;

  return {
    id: remote.id,
    userId: remote.userId,
    name: remote.name,
    iconKey: remote.iconKey ?? undefined,
    category: remote.category ?? 'Other',
    price: remote.price ?? 0,
    currency: remote.currency ?? 'USD',
    billingCycle: remote.billingCycle,
    startDate,
    nextPaymentDate,
    notes: remote.notes ?? undefined,
    reminderDaysBefore: remote.reminderDaysBefore ?? undefined,
    notificationId: remote.notificationId ?? null,
    createdAt: remote.createdAt,
    updatedAt: remote.updatedAt,
  };
}

function toPayload(sub: Subscription): SubscriptionPayload {
  return {
    name: sub.name,
    iconKey: sub.iconKey ?? null,
    category: sub.category ?? null,
    price: sub.price,
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    startDate: sub.startDate,
    nextPaymentDate: sub.nextPaymentDate,
    notes: sub.notes ?? null,
    reminderDaysBefore: sub.reminderDaysBefore ?? null,
    notificationId: sub.notificationId ?? null,
  };
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const remote = await listSubscriptions();
  return remote.map(fromRemote);
}

export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const remote = await getSubscription(id);
  return remote ? fromRemote(remote) : null;
}

export async function addSubscription(sub: Subscription): Promise<Subscription> {
  const created = await createSubscription(toPayload(sub));
  return fromRemote(created);
}

export async function updateSubscription(sub: Subscription): Promise<Subscription> {
  if (!sub.id) throw new Error('Subscription id required for update');
  const updated = await updateSubscriptionRemote(sub.id, toPayload(sub));
  return fromRemote(updated);
}

export async function deleteSubscription(id: string): Promise<void> {
  await deleteSubscriptionRemote(id);
}
