import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable("users", (table) => {
    table.increments("id").unsigned().primary();
    table.string("email", 255).notNullable().unique();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("password", 255).notNullable();
    table.timestamps(true, true);
  });

  // Wallets table — one wallet per user
  await knex.schema.createTable("wallets", (table) => {
    table.increments("id").unsigned().primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("balance", 15, 2).notNullable().defaultTo(0.0);
    table.timestamps(true, true);
  });

  // Transactions table — immutable audit trail
  await knex.schema.createTable("transactions", (table) => {
    table.increments("id").unsigned().primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users");
    table
      .enum("type", ["fund", "transfer", "withdraw"])
      .notNullable();
    table.decimal("amount", 15, 2).notNullable();
    table.decimal("balance_before", 15, 2).notNullable();
    table.decimal("balance_after", 15, 2).notNullable();
    table.string("reference", 36).notNullable().index();
    table
      .integer("counterparty_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users");
    table.string("description", 255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Indexes for query performance
    table.index("user_id", "idx_transactions_user_id");
    table.index("created_at", "idx_transactions_created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
  await knex.schema.dropTableIfExists("wallets");
  await knex.schema.dropTableIfExists("users");
}
