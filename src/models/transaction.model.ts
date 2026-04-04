import { Knex } from "knex";
import db from "../database/db";
import { Transaction, TransactionType } from "../types";

interface CreateTransactionData {
  user_id: number;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  counterparty_id?: number | null;
  description?: string | null;
}

export class TransactionModel {
  private static readonly tableName = "transactions";

  static async create(
    data: CreateTransactionData,
    trx?: Knex.Transaction
  ): Promise<number> {
    const [id] = await (trx || db)(this.tableName).insert(data);
    return id;
  }

  static async createMany(
    records: CreateTransactionData[],
    trx: Knex.Transaction
  ): Promise<void> {
    await trx(this.tableName).insert(records);
  }

  static async findByReference(
    reference: string,
    userId: number
  ): Promise<Transaction | undefined> {
    return db(this.tableName)
      .where({ reference, user_id: userId })
      .first();
  }

  static async findByUserId(
    userId: number,
    page: number,
    limit: number
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;

    const [transactions, [{ total }]] = await Promise.all([
      db(this.tableName)
        .where("user_id", userId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset),
      db(this.tableName)
        .where("user_id", userId)
        .count("id as total"),
    ]);

    return { transactions, total: Number(total) };
  }
}
