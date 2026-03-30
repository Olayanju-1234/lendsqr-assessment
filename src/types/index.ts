export enum TransactionType {
  FUND = "fund",
  TRANSFER = "transfer",
  WITHDRAW = "withdraw",
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  counterparty_id: number | null;
  description: string | null;
  created_at: Date;
}

export interface TokenPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}
