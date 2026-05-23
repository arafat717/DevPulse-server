import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  port: process.env.PORT,
  db_url: process.env.DB_URL,
  access_token: process.env.ACCESS_TOKEN,
};
