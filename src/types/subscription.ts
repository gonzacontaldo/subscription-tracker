export type Subscription = {
  id?: number;
  name: string;
  iconKey?: string; // e.g. "netflix"
  category: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly" | "custom";
  startDate: string;
  nextPaymentDate: string;
  notes?: string;
};
