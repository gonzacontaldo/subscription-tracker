export function calculateNextPayment(startDate: string, billingCycle: string): string {
  const date = new Date(startDate);

  switch (billingCycle) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // Custom → no calculation, keep same date
      break;
  }

  return date.toISOString();
}

// src/utils/dateHelpers.ts
export function rollForwardNextPayment(
  startDate: string,
  billingCycle: string,
  currentNextPayment: string,
): string {
  const next = new Date(currentNextPayment);
  const now = new Date();

  while (next < now) {
    switch (billingCycle) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        // fallback for "custom"
        next.setMonth(next.getMonth() + 1);
        break;
    }
  }

  return next.toISOString();
}

export function daysUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}
