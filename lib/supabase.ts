import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // SSR/build time — retorna cliente temporário sem URL real
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
    );
  }
  if (!_client) {
    _client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Alias para quem importa diretamente
export const supabase = {
  get auth() { return createClient().auth; },
  from: (table: string) => createClient().from(table),
  storage: { from: (bucket: string) => createClient().storage.from(bucket) },
};
