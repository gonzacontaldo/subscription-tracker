export interface Subscription {
  id?: number;
  name: string;
  iconKey?: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly" | "custom";
  startDate: string;
  nextPaymentDate: string;
  notes?: string;
  reminderDaysBefore?: number;   // 👈 default 1
  notificationId?: string | null; // 👈 store Expo’s notif ID
}
