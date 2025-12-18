import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Building2, Users, CreditCard, BarChart3, ArrowRight, Shield, Clock, Smartphone } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Gestion des biens",
    description: "Centralisez tous vos biens immobiliers : appartements, maisons, immeubles et terrains.",
  },
  {
    icon: Users,
    title: "Suivi des locataires",
    description: "Gérez les informations de vos locataires et leur historique de location.",
  },
  {
    icon: CreditCard,
    title: "Paiements simplifiés",
    description: "Suivez les loyers, identifiez les retards et gardez un historique complet.",
  },
  {
    icon: BarChart3,
    title: "Rapports financiers",
    description: "Visualisez vos revenus, dépenses et bénéfices en temps réel.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Vos données sont protégées et chiffrées",
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Automatisez vos tâches répétitives",
  },
  {
    icon: Smartphone,
    title: "Accessible partout",
    description: "Interface responsive sur tous vos appareils",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              ImmoGest
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Connexion</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/auth">Commencer gratuitement</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Simplifiez votre gestion immobilière
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Gérez vos propriétés
              <br />
              <span className="text-primary">en toute simplicité</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ImmoGest centralise la gestion de vos biens, locataires, paiements et
              contrats. Une interface intuitive conçue pour les propriétaires modernes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="gradient" size="xl" asChild>
                <Link to="/auth">
                  Essayer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/dashboard">Voir la démo</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border bg-card shadow-large overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {/* Sidebar placeholder */}
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-sidebar rounded-lg" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-6 bg-primary/20 rounded w-4/5" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                </div>
                {/* Content placeholder */}
                <div className="col-span-3 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="h-24 bg-primary/10 rounded-xl" />
                    <div className="h-24 bg-success/10 rounded-xl" />
                    <div className="h-24 bg-muted rounded-xl" />
                    <div className="h-24 bg-destructive/10 rounded-xl" />
                  </div>
                  <div className="h-48 bg-muted rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Une plateforme complète pour digitaliser et simplifier votre gestion
              immobilière au quotidien.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Pourquoi choisir ImmoGest ?
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl gradient-primary p-8 sm:p-12 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Prêt à simplifier votre gestion immobilière ?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Rejoignez ImmoGest et découvrez une nouvelle façon de gérer vos
              biens immobiliers.
            </p>
            <Button
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              asChild
            >
              <Link to="/auth">
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">
              ImmoGest
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ImmoGest. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
