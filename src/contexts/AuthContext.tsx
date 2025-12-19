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
    
    // Fonction pour mettre à jour l'état d'authentification
    const updateAuthState = (session: Session | null) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    
    // Récupérer la session initiale
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          // Même en cas d'erreur, on met à jour l'état (pas de session)
          updateAuthState(null);
        } else {
          updateAuthState(session);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Erreur lors de la récupération de la session:', error);
        updateAuthState(null);
      });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Log des événements en développement
      if (import.meta.env.DEV) {
        console.log('🔐 Événement d\'authentification:', event, session ? 'Session active' : 'Pas de session');
      }
      
      // Mettre à jour l'état avec la session
      updateAuthState(session);
      
      // Pour SIGNED_IN sans session, récupérer la session
      if (event === 'SIGNED_IN' && !session) {
        try {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession) {
            updateAuthState(newSession);
            console.log('✅ Session récupérée après connexion:', newSession.user.email);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de la session:', error);
        }
      }
      
      // Gérer les événements spécifiques
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Utilisateur connecté:', session.user.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Utilisateur déconnecté');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token rafraîchi');
      }
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
      // Vérifier que Supabase est configuré (utiliser isSupabaseConfigured de supabase.ts)
      // Le client Supabase est toujours initialisé avec les valeurs par défaut si nécessaire

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
      let data, error;
      
      try {
        const result = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        
        data = result.data;
        error = result.error;
      } catch (networkError: any) {
        // Gérer les erreurs réseau (failed to fetch, CORS, etc.)
        console.error('Erreur réseau lors de l\'inscription:', networkError);
        
        if (networkError.message?.includes('fetch') || networkError.message?.includes('network')) {
          return {
            error: {
              message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et que l\'URL Supabase est correcte.',
              code: 'NETWORK_ERROR',
              details: networkError.message
            }
          };
        }
        
        if (networkError.message?.includes('CORS')) {
          return {
            error: {
              message: 'Erreur CORS. Vérifiez la configuration de votre projet Supabase (Site URL et Redirect URLs).',
              code: 'CORS_ERROR'
            }
          };
        }
        
        return {
          error: {
            message: networkError.message || 'Erreur de connexion au serveur',
            code: 'CONNECTION_ERROR',
            details: networkError.message
          }
        };
      }

      if (error) {
        // Améliorer les messages d'erreur
        let errorMessage = error.message || 'Une erreur est survenue lors de l\'inscription';
        
        if (error.message?.includes('fetch')) {
          errorMessage = 'Impossible de se connecter au serveur Supabase. Vérifiez votre connexion et que l\'URL est correcte.';
        } else if (error.message?.includes('User already registered')) {
          errorMessage = 'Cet email est déjà enregistré. Essayez de vous connecter.';
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = 'Adresse email invalide.';
        }
        
        return { 
          error: {
            ...error,
            message: errorMessage
          }
        };
      }

      // Le trigger dans Supabase créera automatiquement le profil
      // Mais on peut aussi le créer manuellement si le trigger n'existe pas
      if (data?.user) {
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
          if (profileError && !profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
            console.warn('Erreur lors de la création du profil:', profileError);
            // On continue quand même car le trigger peut avoir créé le profil
          }
        } catch (profileErr: any) {
          console.warn('Erreur lors de la création du profil:', profileErr);
          // On continue quand même
        }
      }

      return { error: null, data };
    } catch (err: any) {
      console.error('Erreur inattendue lors de l\'inscription:', err);
      
      // Détecter les erreurs réseau
      if (err.message?.includes('fetch') || err.name === 'TypeError' || err.message?.includes('network')) {
        return {
          error: {
            message: 'Erreur de connexion. Vérifiez votre connexion internet et que Supabase est accessible.',
            code: 'NETWORK_ERROR',
            details: err.message
          }
        };
      }
      
      return { 
        error: { 
          message: err.message || 'Une erreur inattendue est survenue lors de l\'inscription',
          code: 'UNKNOWN_ERROR',
          details: err.message
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Le client Supabase est toujours initialisé (avec valeurs par défaut si nécessaire)

      if (!email || !password) {
        return { 
          error: { 
            message: 'Email et mot de passe sont requis' 
          } 
        };
      }

      let data, error;
      
      try {
        const result = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        
        data = result.data;
        error = result.error;
      } catch (networkError: any) {
        console.error('Erreur réseau lors de la connexion:', networkError);
        
        if (networkError.message?.includes('fetch') || networkError.message?.includes('network')) {
          return {
            error: {
              message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et que l\'URL Supabase est correcte.',
              code: 'NETWORK_ERROR',
              details: networkError.message
            }
          };
        }
        
        if (networkError.message?.includes('CORS')) {
          return {
            error: {
              message: 'Erreur CORS. Vérifiez la configuration de votre projet Supabase (Site URL et Redirect URLs).',
              code: 'CORS_ERROR'
            }
          };
        }
        
        return {
          error: {
            message: networkError.message || 'Erreur de connexion au serveur',
            code: 'CONNECTION_ERROR',
            details: networkError.message
          }
        };
      }

      if (error) {
        let errorMessage = error.message || 'Une erreur est survenue lors de la connexion';
        
        if (error.message?.includes('fetch')) {
          errorMessage = 'Impossible de se connecter au serveur Supabase. Vérifiez votre connexion et que l\'URL est correcte.';
        } else if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
          errorMessage = 'Email ou mot de passe incorrect.';
        } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.';
        } else if (error.message?.includes('User not found')) {
          errorMessage = 'Aucun compte trouvé avec cet email.';
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives. Veuillez patienter quelques instants.';
        }
        
        return {
          error: {
            ...error,
            message: errorMessage
          }
        };
      }

      // Vérifier que la session est bien créée
      if (!data?.session) {
        return {
          error: {
            message: 'La session n\'a pas pu être créée. Veuillez réessayer.',
            code: 'SESSION_ERROR'
          }
        };
      }

      return { error: null, data };
    } catch (err: any) {
      console.error('Erreur inattendue lors de la connexion:', err);
      
      if (err.message?.includes('fetch') || err.name === 'TypeError' || err.message?.includes('network')) {
        return {
          error: {
            message: 'Erreur de connexion. Vérifiez votre connexion internet et que Supabase est accessible.',
            code: 'NETWORK_ERROR',
            details: err.message
          }
        };
      }
      
      return { 
        error: { 
          message: err.message || 'Une erreur inattendue est survenue lors de la connexion',
          code: 'UNKNOWN_ERROR',
          details: err.message
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      } else {
        // Forcer la mise à jour de l'état
        setSession(null);
        setUser(null);
        console.log('✅ Déconnexion réussie');
      }
    } catch (err) {
      console.error('Erreur inattendue lors de la déconnexion:', err);
      // Forcer la mise à jour même en cas d'erreur
      setSession(null);
      setUser(null);
    }
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

