import { config } from "dotenv";

// Load .env file
config();

// Server environment variables
export const SERVER_ENV = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  // Add other server environment variables here
};
