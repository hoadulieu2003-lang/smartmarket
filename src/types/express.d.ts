import type { users, stalls } from '@prisma/client';

export type Scope =
  | { all: true }
  | { provinceId: string }
  | { marketIds: string[] };

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: users;
      scope?: Scope;
      seller?: { stallId: string; marketId: string; stall: stalls; contractId: string };
    }
  }
}

export {};
