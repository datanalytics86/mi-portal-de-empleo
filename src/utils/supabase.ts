import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchOfertas() {
  const { data, error } = await supabase
    .from('ofertas')
    .select('id, titulo, descripcion, empresa, tipo_jornada, categoria, comuna, ubicacion')
    .eq('activa', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (
    data?.map((item) => ({
      ...item,
      lat: item.ubicacion?.coordinates?.[1],
      lng: item.ubicacion?.coordinates?.[0],
    })) ?? []
  );
}
