import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || '';

// Vérifier que les variables sont configurées
const isConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder');

// Créer le client Supabase
let supabase: SupabaseClient;

if (isConfigured) {
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
    
    // Tester la connexion
    if (import.meta.env.DEV) {
      console.log('✅ Supabase client initialisé avec succès');
      console.log('📍 URL:', supabaseUrl);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
    // Créer un client de fallback pour éviter les crashes
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
} else {
  // Client placeholder si non configuré
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  
  // Avertir l'utilisateur
  const errorMessage = !supabaseUrl || !supabaseAnonKey
    ? 'Les variables d\'environnement Supabase (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY) ne sont pas configurées.'
    : 'Les variables d\'environnement Supabase semblent invalides.';
  
  console.error('❌', errorMessage);
  console.error('📝 Vérifiez votre fichier .env ou les variables d\'environnement de votre plateforme de déploiement.');
  
  if (import.meta.env.DEV) {
    console.error('💡 Créez un fichier .env à la racine du projet avec :');
    console.error('   VITE_SUPABASE_URL=https://votre-projet.supabase.co');
    console.error('   VITE_SUPABASE_ANON_KEY=votre_cle_anon');
  }
}

export { supabase };
export const isSupabaseConfigured = isConfigured;

