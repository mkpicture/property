import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; data?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Récupérer la session initiale
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Erreur lors de la récupération de la session:', error);
        setLoading(false);
      });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Validation basique
      if (!email || !password || !name) {
        return { 
          error: { 
            message: 'Tous les champs sont requis' 
          } 
        };
      }

      if (password.length < 6) {
        return { 
          error: { 
            message: 'Le mot de passe doit contenir au moins 6 caractères' 
          } 
        };
      }

      // Inscription avec Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        return { error };
      }

      // Le trigger dans Supabase créera automatiquement le profil
      // Mais on peut aussi le créer manuellement si le trigger n'existe pas
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email.trim().toLowerCase(),
              full_name: name.trim(),
            })
            .select()
            .single();

          // Si l'insertion échoue mais que l'utilisateur existe, c'est peut-être que le trigger l'a déjà créé
          if (profileError && !profileError.message.includes('duplicate')) {
            console.warn('Erreur lors de la création du profil:', profileError);
            // On continue quand même car le trigger peut avoir créé le profil
          }
        } catch (profileErr) {
          console.warn('Erreur lors de la création du profil:', profileErr);
          // On continue quand même
        }
      }

      return { error: null, data };
    } catch (err: any) {
      return { 
        error: { 
          message: err.message || 'Une erreur est survenue lors de l\'inscription' 
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        return { 
          error: { 
            message: 'Email et mot de passe sont requis' 
          } 
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      return { error, data };
    } catch (err: any) {
      return { 
        error: { 
          message: err.message || 'Une erreur est survenue lors de la connexion' 
        } 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

