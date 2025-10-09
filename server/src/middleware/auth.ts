import type { Request, Response, NextFunction } from 'express';

import { verifyJwt } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(BEARER_PREFIX.length);
  const payload = verifyJwt(token);

  if (!payload?.sub) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = payload.sub;
  return next();
}
