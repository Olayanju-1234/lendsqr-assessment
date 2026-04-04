import dotenv from "dotenv";
import { Knex } from "knex";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const baseConfig: Knex.Config = {
  client: "mysql2",
  migrations: {
    directory: path.join(__dirname, "../database/migrations"),
    extension: "ts",
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export const development: Knex.Config = {
  ...baseConfig,
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "demo_credit",
  },
};

export const test: Knex.Config = {
  ...baseConfig,
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_TEST || "demo_credit_test",
  },
};

export const production: Knex.Config = {
  ...baseConfig,
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 20,
  },
};

export default { development, test, production };
