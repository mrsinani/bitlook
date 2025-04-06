import { createClient } from "@supabase/supabase-js";
import { SERVER_ENV } from "../env-config.js";

const supabaseUrl = SERVER_ENV.SUPABASE_URL;
const supabaseAnonKey = SERVER_ENV.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
