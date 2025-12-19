import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Building2, Users, CreditCard, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatFCFA } from "@/lib/currency";

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

const properties = [
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
          {properties.map((property, index) => (
            <PropertyCard key={property.id} {...property} delay={index * 100} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
