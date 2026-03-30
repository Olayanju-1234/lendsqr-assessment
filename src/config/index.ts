import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "demo_credit",

  JWT_SECRET: process.env.JWT_SECRET || "faux-secret-key",

  ADJUTOR_BASE_URL:
    process.env.ADJUTOR_BASE_URL || "https://adjutor.lendsqr.com/v2",
  ADJUTOR_API_KEY: process.env.ADJUTOR_API_KEY || "",
};

export default config;
