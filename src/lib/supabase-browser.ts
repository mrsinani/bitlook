import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

// Create the supabase client for browser use
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
