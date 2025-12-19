import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Building2, Users, CreditCard, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatFCFA } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Demo data
const stats = [
  {
    title: "Total Propriétés",
    value: 12,
    subtitle: "8 loués · 4 vacants",
    icon: Building2,
    variant: "primary" as const,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Locataires Actifs",
    value: 24,
    subtitle: "2 nouveaux ce mois",
    icon: Users,
    variant: "success" as const,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Revenus Mensuels",
    value: formatFCFA(15800),
    subtitle: "Mai 2024",
    icon: CreditCard,
    variant: "default" as const,
    trend: { value: 5, isPositive: true },
  },
  {
    title: "Loyers Impayés",
    value: formatFCFA(2350),
    subtitle: "3 locataires concernés",
    icon: AlertTriangle,
    variant: "destructive" as const,
    trend: { value: 15, isPositive: false },
  },
];

const demoProperties = [
  {
    id: "1",
    name: "Résidence Les Jardins",
    type: "Immeuble · 8 unités",
    address: "12 rue des Fleurs, 75001 Paris",
    status: "loué" as const,
    tenants: 8,
    monthlyRent: 6400,
  },
  {
    id: "2",
    name: "Appartement Haussmann",
    type: "Appartement · T4",
    address: "45 avenue Victor Hugo, 75016 Paris",
    status: "loué" as const,
    tenants: 1,
    monthlyRent: 2200,
  },
  {
    id: "3",
    name: "Studio Saint-Michel",
    type: "Studio · 25m²",
    address: "8 rue de la Harpe, 75005 Paris",
    status: "vacant" as const,
    tenants: 0,
    monthlyRent: 850,
  },
  {
    id: "4",
    name: "Maison de Ville",
    type: "Maison · 5 pièces",
    address: "23 allée des Roses, 92100 Boulogne",
    status: "loué" as const,
    tenants: 1,
    monthlyRent: 3200,
  },
];

const alerts = [
  {
    id: "1",
    type: "payment" as const,
    title: "Loyer impayé",
    description: "M. Dupont - Appartement Haussmann",
    date: "Il y a 3 jours",
  },
  {
    id: "2",
    type: "contract" as const,
    title: "Contrat expire bientôt",
    description: "Mme Martin - Studio Saint-Michel",
    date: "Dans 15 jours",
  },
  {
    id: "3",
    type: "payment" as const,
    title: "Loyer impayé",
    description: "M. Bernard - Résidence Les Jardins",
    date: "Il y a 1 semaine",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    status: "loué" | "vacant";
    monthly_rent: number;
    image_url?: string;
  }>>([]);
  
  // Données de démo pour affichage si aucune propriété réelle
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProperties();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProperties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Erreur Supabase lors du chargement des propriétés:", error);
        // En cas d'erreur, utiliser un tableau vide (les données de démo seront utilisées)
        setProperties([]);
        return;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error("Erreur inattendue lors du chargement des propriétés:", error);
      // En cas d'erreur, utiliser un tableau vide (les données de démo seront utilisées)
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Utiliser les données réelles si disponibles, sinon les données de démo
  const displayProperties = properties.length > 0 
    ? properties.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address,
        status: p.status,
        tenants: 0, // TODO: Calculer le nombre de locataires
        monthlyRent: p.monthly_rent,
        imageUrl: p.image_url,
      }))
    : demoProperties.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address,
        status: p.status,
        tenants: p.tenants,
        monthlyRent: p.monthlyRent,
      }));

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue ! Voici un aperçu de votre portefeuille immobilier.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/properties/new">
            <Plus className="h-4 w-4" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>

      {/* Charts and Alerts */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <RevenueChart className="lg:col-span-2" />
        <AlertCard alerts={alerts} />
      </div>

      {/* Properties Section */}
      <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Vos propriétés
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/properties">Voir tout</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-4 flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayProperties.length > 0 ? (
            displayProperties.map((property, index) => (
              <PropertyCard key={property.id} {...property} delay={index * 100} />
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Aucune propriété pour le moment</p>
              <Button variant="gradient" className="mt-4" asChild>
                <Link to="/properties/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre première propriété
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
