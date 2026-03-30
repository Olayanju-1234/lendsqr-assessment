import knex, { Knex } from "knex";
import knexConfig from "../config/knexfile";

const environment = process.env.NODE_ENV || "development";
const config =
  knexConfig[environment as keyof typeof knexConfig] as Knex.Config;

const db: Knex = knex(config);

export default db;
