import { Knex } from "knex";
import db from "../database/db";
import { User } from "../types";

export class UserModel {
  private static readonly tableName = "users";

  static async findById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<User | undefined> {
    return (trx || db)(this.tableName).where("id", id).first();
  }

  static async findByEmail(
    email: string,
    trx?: Knex.Transaction
  ): Promise<User | undefined> {
    return (trx || db)(this.tableName).where("email", email).first();
  }

  static async create(
    data: Pick<User, "email" | "first_name" | "last_name" | "password">,
    trx?: Knex.Transaction
  ): Promise<number> {
    const [id] = await (trx || db)(this.tableName).insert(data);
    return id;
  }
}
