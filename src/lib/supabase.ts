import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("⚠️ Erro: Variáveis de ambiente do Supabase não estão configuradas corretamente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
