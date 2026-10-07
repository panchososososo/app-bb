// Llaves del proyecto de Supabase.
//   SUPABASE_URL → Supabase → Settings → Data API → Project URL
//   SUPABASE_KEY → Supabase → Settings → API Keys → Publishable key (sb_publishable_…)
// La publishable key es pública por diseño: sin iniciar sesión no deja leer ni
// escribir nada, porque las reglas RLS de supabase/esquema.sql lo impiden.
// ⚠️ Nunca pongas aquí la Secret key (sb_secret_…) ni la service_role.
// Mientras estén vacías, la app funciona solo con el almacenamiento del teléfono.
export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_KEY: '',
};
