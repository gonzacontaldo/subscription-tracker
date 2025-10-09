import type { SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

import { env } from '../environment';

export interface JwtPayload {
  sub: string;
}

const signOptions: SignOptions = env.jwtExpiresIn
  ? { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }
  : {};

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, signOptions);
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      ignoreExpiration: false,
    } as VerifyOptions);
    if (typeof decoded === 'string') {
      return null;
    }
    return decoded as JwtPayload;
  } catch (error) {
    void error;
    return null;
  }
}
