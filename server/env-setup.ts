import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
config({ path: resolve(process.cwd(), "server", ".env") });

// For development: Mock API integrations if API keys are not available
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  // Provide mock values for required API keys in development
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "your_openai_api_key"
  ) {
    process.env.OPENAI_API_KEY = "sk-mock-key-for-development";
    console.warn(
      "⚠️ Using mock OpenAI API key. Some AI features will not work."
    );
  }

  if (
    !process.env.TAVILY_API_KEY ||
    process.env.TAVILY_API_KEY === "your_tavily_api_key"
  ) {
    process.env.TAVILY_API_KEY = "tavily-mock-key-for-development";
    console.warn(
      "⚠️ Using mock Tavily API key. Search features will not work."
    );
  }
}

// Make environment variables available to import.meta.env for compatibility
if (typeof globalThis !== "undefined") {
  // @ts-ignore
  globalThis.import = {
    meta: {
      env: process.env,
    },
  };
}
