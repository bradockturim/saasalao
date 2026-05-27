import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

// Server-only client (service role) — nunca expor no client-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const STAFF_PHOTOS_BUCKET = "staff-photos";
