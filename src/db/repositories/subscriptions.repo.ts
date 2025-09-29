import { Subscription } from "../../types/subscription";
import { execute, queryAll, queryOne } from "../database";

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return await queryAll<Subscription>(
    "SELECT * FROM subscriptions ORDER BY id DESC"
  );
}

export async function getSubscriptionById(
  id: number
): Promise<Subscription | null> {
  return await queryOne<Subscription>(
    "SELECT * FROM subscriptions WHERE id = ?",
    [id]
  );
}

export async function addSubscription(sub: Subscription) {
  const query = `
    INSERT INTO subscriptions 
    (name, iconKey, category, price, currency, billingCycle, startDate, nextPaymentDate, notes, reminderDaysBefore, notificationId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    sub.name,
    sub.iconKey || "default",
    sub.category,
    sub.price,
    sub.currency,
    sub.billingCycle,
    sub.startDate,
    sub.nextPaymentDate,
    sub.notes || "",
    sub.reminderDaysBefore ?? 1,
    sub.notificationId || null,
  ];
  await execute(query, params);
}

export async function updateSubscription(sub: Subscription) {
  if (!sub.id) throw new Error("Subscription id required for update");

  const query = `
    UPDATE subscriptions
    SET name = ?, iconKey = ?, category = ?, price = ?, currency = ?, billingCycle = ?, 
        startDate = ?, nextPaymentDate = ?, notes = ?, reminderDaysBefore = ?, notificationId = ?
    WHERE id = ?
  `;
  const params = [
    sub.name,
    sub.iconKey || "default",
    sub.category,
    sub.price,
    sub.currency,
    sub.billingCycle,
    sub.startDate,
    sub.nextPaymentDate,
    sub.notes || "",
    sub.reminderDaysBefore ?? 1,
    sub.notificationId || null,
    sub.id,
  ];
  await execute(query, params);
}

export async function deleteSubscription(id: number) {
  await execute("DELETE FROM subscriptions WHERE id = ?", [id]);
}
