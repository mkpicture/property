import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn, user, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!loading && user) {
      // Petit délai pour éviter les redirections multiples
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    if (!formData.email) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir votre email.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.password) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir votre mot de passe.",
        variant: "destructive",
      });
      return false;
    }

    if (!isLogin && !formData.name.trim()) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir votre nom complet.",
        variant: "destructive",
      });
      return false;
    }

    if (!isLogin && formData.password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error, data } = await signIn(formData.email, formData.password);
        
        if (error) {
          let errorMessage = "Une erreur est survenue lors de la connexion.";
          
          if (error.message) {
            if (error.message.includes("Invalid login credentials")) {
              errorMessage = "Email ou mot de passe incorrect.";
            } else if (error.message.includes("Email not confirmed")) {
              errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
            } else {
              errorMessage = error.message;
            }
          }

          toast({
            title: "Erreur de connexion",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          toast({
            title: "Connexion réussie",
            description: "Vous allez être redirigé vers le tableau de bord.",
            duration: 3000,
          });
          // Attendre que l'état soit mis à jour via onAuthStateChange
          // Puis rediriger
          setTimeout(() => {
            try {
              navigate("/dashboard", { replace: true });
            } catch (navError) {
              console.error("Erreur de navigation:", navError);
              window.location.href = "/dashboard";
            }
          }, 500);
        } else {
          // Si pas de session mais pas d'erreur, c'est peut-être que l'email nécessite confirmation
          toast({
            title: "Connexion en attente",
            description: "Vérifiez votre email pour confirmer votre compte.",
            variant: "default",
            duration: 5000,
          });
          setIsLoading(false);
        }
      } else {
        const { error, data } = await signUp(formData.email, formData.password, formData.name);
        
        if (error) {
          let errorMessage = "Une erreur est survenue lors de l'inscription.";
          let errorTitle = "Erreur d'inscription";
          
          // Gérer les différents types d'erreurs
          if (error.code === 'CONFIG_ERROR' || error.code === 'NETWORK_ERROR' || error.code === 'CORS_ERROR') {
            errorTitle = "Problème de configuration";
            errorMessage = error.message || errorMessage;
          } else if (error.message) {
            if (error.message.includes("User already registered") || error.message.includes("already registered")) {
              errorMessage = "Cet email est déjà enregistré. Essayez de vous connecter.";
            } else if (error.message.includes("Password") || error.message.includes("password")) {
              errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
            } else if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed to fetch")) {
              errorTitle = "Erreur de connexion";
              errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet et que Supabase est correctement configuré.";
            } else if (error.message.includes("CORS")) {
              errorTitle = "Erreur de configuration";
              errorMessage = "Erreur CORS. Vérifiez la configuration de votre projet Supabase (Site URL et Redirect URLs dans Authentication > Settings).";
            } else {
              errorMessage = error.message;
            }
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
          
          // Afficher des détails supplémentaires en développement
          if (import.meta.env.DEV && error.details) {
            console.error('Détails de l\'erreur:', error.details);
          }
        } else {
          // Vérifier si l'email nécessite une confirmation
          const needsConfirmation = data?.user && !data.session;
          
          // Si une session est créée directement (email confirmation désactivée)
          if (data?.session) {
            toast({
              title: "Compte créé avec succès",
              description: "Vous allez être redirigé vers le tableau de bord.",
              duration: 3000,
            });
            // Attendre que la session soit mise à jour
            setTimeout(() => {
              try {
                navigate("/dashboard", { replace: true });
              } catch (navError) {
                console.error("Erreur de navigation:", navError);
                window.location.href = "/dashboard";
              }
            }, 300);
          } else {
            toast({
              title: "Compte créé avec succès",
              description: needsConfirmation
                ? "Un email de confirmation a été envoyé. Vérifiez votre boîte de réception."
                : "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
            });
            
            // Réinitialiser le formulaire et passer en mode connexion
            setFormData({
              email: formData.email, // Garder l'email pour faciliter la connexion
              password: "",
              name: "",
            });
            setIsLogin(true);
          }
        }
      }
    } catch (error: any) {
      console.error("Erreur inattendue dans handleSubmit:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur">
              <Home className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold">ImmoGest</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="font-display text-4xl font-bold leading-tight">
              Gérez vos biens immobiliers en toute simplicité
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Une plateforme intuitive pour centraliser la gestion de vos
              propriétés, locataires, paiements et bien plus encore.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full backdrop-blur">
                <span>✓</span> Suivi des loyers
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full backdrop-blur">
                <span>✓</span> Gestion des contrats
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full backdrop-blur">
                <span>✓</span> Rapports financiers
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2024 ImmoGest. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              ImmoGest
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Accédez à votre espace propriétaire"
                : "Rejoignez ImmoGest et simplifiez votre gestion"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isLogin
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                !isLogin
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-slide-down">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jean Dupont"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
