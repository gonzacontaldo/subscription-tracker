import type { Subscription } from '../../types/subscription';
import { execute, queryAll, queryOne } from '../database';

export async function getAllSubscriptions(userId: number): Promise<Subscription[]> {
  return await queryAll<Subscription>(
    'SELECT * FROM subscriptions WHERE userId = ? ORDER BY id DESC',
    [userId],
  );
}

export async function getSubscriptionById(
  id: number,
  userId: number,
): Promise<Subscription | null> {
  return await queryOne<Subscription>(
    'SELECT * FROM subscriptions WHERE id = ? AND userId = ?',
    [id, userId],
  );
}

export async function addSubscription(sub: Subscription & { userId: number }) {
  const query = `
    INSERT INTO subscriptions 
    (name, iconKey, category, price, currency, billingCycle, startDate, nextPaymentDate, notes, reminderDaysBefore, notificationId, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    sub.name,
    sub.iconKey || 'default',
    sub.category,
    sub.price,
    sub.currency,
    sub.billingCycle,
    sub.startDate,
    sub.nextPaymentDate,
    sub.notes || '',
    sub.reminderDaysBefore ?? 1,
    sub.notificationId || null,
    sub.userId,
  ];
  await execute(query, params);
}

export async function updateSubscription(sub: Subscription) {
  if (!sub.id) throw new Error('Subscription id required for update');
  if (sub.userId == null) throw new Error('Subscription user id required for update');

  const query = `
    UPDATE subscriptions
    SET name = ?, iconKey = ?, category = ?, price = ?, currency = ?, billingCycle = ?, 
        startDate = ?, nextPaymentDate = ?, notes = ?, reminderDaysBefore = ?, notificationId = ?
    WHERE id = ? AND userId = ?
  `;
  const params = [
    sub.name,
    sub.iconKey || 'default',
    sub.category,
    sub.price,
    sub.currency,
    sub.billingCycle,
    sub.startDate,
    sub.nextPaymentDate,
    sub.notes || '',
    sub.reminderDaysBefore ?? 1,
    sub.notificationId || null,
    sub.id,
    sub.userId,
  ];
  await execute(query, params);
}

export async function deleteSubscription(id: number, userId: number) {
  await execute('DELETE FROM subscriptions WHERE id = ? AND userId = ?', [id, userId]);
}
