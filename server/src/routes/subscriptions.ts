import type { Subscription as PrismaSubscription } from '@prisma/client';
import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const subscriptionSchema = z.object({
  name: z.string().min(1),
  iconKey: z.string().optional(),
  category: z.string().optional(),
  price: z.number().finite().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'custom']),
  startDate: z.string().datetime().optional(),
  nextPaymentDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  reminderDaysBefore: z.number().int().min(0).optional(),
  notificationId: z.string().optional().nullable(),
});

function serializeSubscription(sub: PrismaSubscription) {
  return {
    id: sub.id,
    userId: sub.userId,
    name: sub.name,
    iconKey: sub.iconKey,
    category: sub.category,
    price: sub.price ? Number(sub.price) : null,
    currency: sub.currency,
    billingCycle: sub.billingCycle as 'monthly' | 'yearly' | 'weekly' | 'custom',
    startDate: sub.startDate?.toISOString() ?? null,
    nextPaymentDate: sub.nextPaymentDate?.toISOString() ?? null,
    notes: sub.notes,
    reminderDaysBefore: sub.reminderDaysBefore,
    notificationId: sub.notificationId,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

export function createSubscriptionsRouter(): Router {
  const router = createRouter();

  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const userId = req.userId!;
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(subscriptions.map(serializeSubscription));
  });

  router.get('/:id', async (req, res) => {
    const userId = req.userId!;
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.json(serializeSubscription(subscription));
  });

  router.post('/', async (req, res) => {
    const parse = subscriptionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const userId = req.userId!;
    const data = parse.data;

    const created = await prisma.subscription.create({
      data: {
        userId,
        name: data.name,
        iconKey: data.iconKey,
        category: data.category,
        price: data.price != null ? data.price : undefined,
        currency: data.currency,
        billingCycle: data.billingCycle,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        nextPaymentDate: data.nextPaymentDate
          ? new Date(data.nextPaymentDate)
          : undefined,
        notes: data.notes,
        reminderDaysBefore: data.reminderDaysBefore,
        notificationId: data.notificationId ?? undefined,
      },
    });

    return res.status(201).json(serializeSubscription(created));
  });

  router.put('/:id', async (req, res) => {
    const parse = subscriptionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        name: parse.data.name,
        iconKey: parse.data.iconKey,
        category: parse.data.category,
        price: parse.data.price != null ? parse.data.price : undefined,
        currency: parse.data.currency,
        billingCycle: parse.data.billingCycle,
        startDate: parse.data.startDate ? new Date(parse.data.startDate) : undefined,
        nextPaymentDate: parse.data.nextPaymentDate
          ? new Date(parse.data.nextPaymentDate)
          : undefined,
        notes: parse.data.notes,
        reminderDaysBefore: parse.data.reminderDaysBefore,
        notificationId: parse.data.notificationId ?? undefined,
      },
    });

    return res.json(serializeSubscription(updated));
  });

  router.delete('/:id', async (req, res) => {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.delete({ where: { id } });
    return res.status(204).send();
  });

  return router;
}
