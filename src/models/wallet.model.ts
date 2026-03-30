import { Knex } from "knex";
import db from "../database/db";
import { Wallet } from "../types";

export class WalletModel {
  private static readonly tableName = "wallets";

  static async findByUserId(
    userId: number,
    trx?: Knex.Transaction
  ): Promise<Wallet | undefined> {
    return (trx || db)(this.tableName).where("user_id", userId).first();
  }

  static async findByUserIdForUpdate(
    userId: number,
    trx: Knex.Transaction
  ): Promise<Wallet | undefined> {
    return trx(this.tableName).where("user_id", userId).forUpdate().first();
  }

  static async updateBalance(
    userId: number,
    newBalance: number,
    trx: Knex.Transaction
  ): Promise<void> {
    await trx(this.tableName)
      .where("user_id", userId)
      .update({ balance: newBalance });
  }

  static async create(
    userId: number,
    trx?: Knex.Transaction
  ): Promise<number> {
    const [id] = await (trx || db)(this.tableName).insert({
      user_id: userId,
      balance: 0,
    });
    return id;
  }
}
