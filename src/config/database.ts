import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const configDatabase = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.MODE === "prod",
};

export default new Pool(configDatabase);
