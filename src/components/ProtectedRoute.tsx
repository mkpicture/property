import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout de sécurité : si le chargement prend plus de 5 secondes, on considère qu'il y a un problème
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
        console.warn('⚠️ Timeout de chargement de l\'authentification atteint');
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setTimeoutReached(false);
    }
  }, [loading]);

  // Afficher un loader pendant le chargement initial
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si timeout atteint ou pas d'utilisateur après le chargement, rediriger vers l'authentification
  if (timeoutReached || (!loading && !user)) {
    if (timeoutReached) {
      console.warn('Redirection vers /auth car timeout de chargement atteint');
    }
    return <Navigate to="/auth" replace />;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
}


