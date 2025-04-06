import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the .env file
const envPath = resolve(__dirname, ".env");

// Check if .env exists, otherwise try to look for it in the parent directory
if (!fs.existsSync(envPath)) {
  const parentEnvPath = resolve(__dirname, "..", ".env");
  if (fs.existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
  } else {
    dotenv.config();
  }
} else {
  dotenv.config({ path: envPath });
}

// Export environment variables
export const SERVER_ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  LANGSMITH_TRACING: process.env.LANGSMITH_TRACING,
  LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT,
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
};
