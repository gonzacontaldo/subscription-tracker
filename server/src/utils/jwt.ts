import jwt from 'jsonwebtoken';

import { env } from '../environment';

export interface JwtPayload {
  sub: string;
}

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === 'string') {
      return null;
    }
    return decoded as JwtPayload;
  } catch (error) {
    void error;
    return null;
  }
}
