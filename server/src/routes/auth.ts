import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { signJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';

const authSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
});

const registerSchema = authSchema.extend({
  displayName: z
    .string()
    .min(2)
    .max(64)
    .transform((value) => value.trim()),
});

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2)
    .max(64)
    .transform((value) => value.trim())
    .optional(),
  avatarUri: z
    .union([
      z
        .string()
        .min(1)
        .max(2048)
        .transform((value) => value.trim()),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional(),
});

export function createAuthRouter(): Router {
  const router = createRouter();

  router.post('/register', async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { email, password, displayName } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
      },
    });

    const token = signJwt({ sub: user.id });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUri: user.avatarUri,
      },
    });
  });

  router.post('/login', async (req, res) => {
    const parse = authSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = signJwt({ sub: user.id });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUri: user.avatarUri,
      },
    });
  });

  router.get('/me', requireAuth, async (req, res) => {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUri: user.avatarUri,
    });
  });

  router.patch('/profile', requireAuth, async (req, res) => {
    const parse = profileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const userId = req.userId!;
    const next = parse.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: next.displayName,
        avatarUri: next.avatarUri === undefined ? undefined : next.avatarUri,
      },
    });

    return res.json({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUri: updated.avatarUri,
    });
  });

  return router;
}
