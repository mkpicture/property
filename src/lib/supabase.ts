import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Valeurs par défaut (votre configuration Supabase)
const DEFAULT_SUPABASE_URL = 'https://vufrsgvhkeinifqmouei.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZnJzZ3Zoa2VpbmlmcW1vdWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjYxNjAsImV4cCI6MjA4MTY0MjE2MH0.FfMGMxxOXrlAildbcMdtpEod9OX_TKj9nkqW6M5srLQ';

// Récupérer les variables d'environnement ou utiliser les valeurs par défaut
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || DEFAULT_SUPABASE_ANON_KEY;

// Vérifier que les valeurs sont valides
const isConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 50; // Les clés Supabase sont longues

// Créer le client Supabase
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'immogest-web',
      },
    },
  });
  
  // Log de confirmation
  if (import.meta.env.DEV) {
    const usingEnv = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log('✅ Supabase client initialisé avec succès');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Source:', usingEnv ? 'Variables d\'environnement' : 'Valeurs par défaut');
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
  // Créer un client de fallback pour éviter les crashes
  supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  console.warn('⚠️ Utilisation du client de fallback');
}

export { supabase };
export const isSupabaseConfigured = isConfigured;

