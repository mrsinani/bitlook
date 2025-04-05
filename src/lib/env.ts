// Extend Window interface to include ENV
interface Window {
  ENV?: {
    [key: string]: string;
  };
}

// Browser-safe environment variable handling
// We attempt to use Vite's import.meta.env, then fall back to window.ENV if available

// Helper to safely access environment variables from multiple sources
function getEnvVar(key: string, defaultValue: string = ""): string {
  // First try Vite's import.meta.env
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env[key]
  ) {
    return import.meta.env[key];
  }

  // Then try window.ENV (set in index.html)
  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  // Fall back to the default
  return defaultValue;
}

// Common environment variables used in the application
export const API_URL = getEnvVar("VITE_API_URL", "http://localhost:3001");
export const SUPABASE_URL = getEnvVar(
  "VITE_SUPABASE_URL",
  "https://your-supabase-url.supabase.co"
);
export const SUPABASE_ANON_KEY = getEnvVar(
  "VITE_SUPABASE_ANON_KEY",
  "your-supabase-anon-key"
);
