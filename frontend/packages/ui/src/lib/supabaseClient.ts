// c:\Users\Lenovo\Downloads\project-finals-CAS\project-finals-CAS\CivicAlert\frontend\packages\ui\src\lib\supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Allow dev builds without env; runtime calls will fail gracefully.
  console.warn("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. CivicAlert requires Supabase.");
}

export const supabase = createClient(supabaseUrl ?? "http://localhost", supabaseAnonKey ?? "anon", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } },
});
