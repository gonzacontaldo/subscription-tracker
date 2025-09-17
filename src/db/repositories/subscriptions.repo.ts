import { Subscription } from "../../types/subscription";
import { executeSql } from "../database";

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const result = await executeSql("SELECT * FROM subscriptions ORDER BY id DESC");
  return result.rows._array;
}

export async function getSubscriptionById(id: number): Promise<Subscription | null> {
  const result = await executeSql("SELECT * FROM subscriptions WHERE id = ?", [id]);
  return result.rows.length > 0 ? result.rows.item(0) : null;
}

export async function addSubscription(sub: Subscription) {
  const query = `
    INSERT INTO subscriptions (name, iconKey, category, price, currency, billingCycle, startDate, nextPaymentDate, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
  ];
  await executeSql(query, params);
}

export async function updateSubscription(sub: Subscription) {
  if (!sub.id) throw new Error("Subscription id required for update");
  const query = `
    UPDATE subscriptions
    SET name = ?, iconKey = ?, category = ?, price = ?, currency = ?, billingCycle = ?, startDate = ?, nextPaymentDate = ?, notes = ?
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
    sub.id,
  ];
  await executeSql(query, params);
}

export async function deleteSubscription(id: number) {
  await executeSql("DELETE FROM subscriptions WHERE id = ?", [id]);
}
