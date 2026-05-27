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
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [tenantCounts, setTenantCounts] = useState<Record<string, number>>({});
  
  const [properties, setProperties] = useState<Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    status: "loué" | "vacant";
    monthly_rent: number;
    image_url?: string;
  }>>([]);

  const [stats, setStats] = useState([
    {
      title: "Total Propriétés",
      value: 0,
      subtitle: "0 loués · 0 vacants",
      icon: Building2,
      variant: "primary" as const,
    },
    {
      title: "Locataires Actifs",
      value: 0,
      subtitle: "0 actif(s)",
      icon: Users,
      variant: "success" as const,
    },
    {
      title: "Revenus Mensuels",
      value: formatFCFA(0),
      subtitle: "Ce mois",
      icon: CreditCard,
      variant: "default" as const,
    },
    {
      title: "Loyers Impayés",
      value: formatFCFA(0),
      subtitle: "0 locataire(s) concerné(s)",
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
  ]);

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: "payment" | "contract" | "maintenance";
    title: string;
    description: string;
    date: string;
  }>>([]);

  const [chartData, setChartData] = useState<Array<{
    month: string;
    revenus: number;
    depenses: number;
  }>>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
      setLoadingChart(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    setLoadingChart(true);

    try {
      // 1. Charger les propriétés
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (propsError) {
        console.warn("Erreur lors du chargement des propriétés:", propsError.message);
      }

      const propertiesList = propsData || [];
      setProperties(propertiesList.slice(0, 4)); // Limiter aux 4 plus récentes pour le dashboard

      // 2. Compter les locataires par propriété
      const propertyIds = propertiesList.map(p => p.id);
      const counts: Record<string, number> = {};
      
      if (propertyIds.length > 0) {
        try {
          const { data: tenantsData, error: tenantsCountError } = await supabase
            .from("tenants")
            .select("property_id")
            .eq("user_id", user.id)
            .in("property_id", propertyIds)
            .is("move_out_date", null);

          if (tenantsCountError) throw tenantsCountError;

          tenantsData?.forEach(t => {
            if (t.property_id) {
              counts[t.property_id] = (counts[t.property_id] || 0) + 1;
            }
          });
        } catch (tErr: any) {
          console.warn("Erreur lors du comptage des locataires:", tErr.message);
        }
      }
      setTenantCounts(counts);

      // 3. Charger le nombre de locataires actifs globalement
      let activeTenantsCount = 0;
      try {
        const { count, error: countError } = await supabase
          .from("tenants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("move_out_date", null);
        
        if (countError) throw countError;
        activeTenantsCount = count || 0;
      } catch (err: any) {
        console.warn("Impossible de charger le nombre de locataires:", err.message);
      }

      // 4. Charger les revenus du mois en cours
      let totalMonthlyRevenue = 0;
      const now = new Date();
      const currentMonthStart = startOfMonth(now).toISOString().split("T")[0];
      const currentMonthEnd = endOfMonth(now).toISOString().split("T")[0];
      const currentMonthName = format(now, "MMMM yyyy", { locale: fr });
      const formattedMonthSubtitle = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

      try {
        const { data: monthlyPaymentsData, error: monthlyPaymentsError } = await supabase
          .from("payments")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "payé")
          .gte("paid_date", currentMonthStart)
          .lte("paid_date", currentMonthEnd);

        if (monthlyPaymentsError) throw monthlyPaymentsError;
        totalMonthlyRevenue = monthlyPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      } catch (err: any) {
        console.warn("Erreur lors du chargement des revenus mensuels:", err.message);
      }

      // 5. Charger les loyers impayés (en retard ou en attente)
      let totalUnpaid = 0;
      let concernedTenantsCount = 0;

      try {
        const { data: unpaidPaymentsData, error: unpaidPaymentsError } = await supabase
          .from("payments")
          .select("amount, tenant_id")
          .eq("user_id", user.id)
          .in("status", ["en retard", "en attente"]);

        if (unpaidPaymentsError) throw unpaidPaymentsError;
        totalUnpaid = unpaidPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        concernedTenantsCount = new Set(unpaidPaymentsData?.map(p => p.tenant_id)).size;
      } catch (err: any) {
        console.warn("Erreur lors du chargement des loyers impayés:", err.message);
      }

      // Calcul des statistiques
      const totalProps = propertiesList.length;
      const rentedProps = propertiesList.filter(p => p.status === "loué").length;
      const vacantProps = propertiesList.filter(p => p.status === "vacant").length;

      setStats([
        {
          title: "Total Propriétés",
          value: totalProps,
          subtitle: `${rentedProps} loués · ${vacantProps} vacants`,
          icon: Building2,
          variant: "primary" as const,
        },
        {
          title: "Locataires Actifs",
          value: activeTenantsCount,
          subtitle: `${activeTenantsCount} actif(s)`,
          icon: Users,
          variant: "success" as const,
        },
        {
          title: "Revenus Mensuels",
          value: formatFCFA(totalMonthlyRevenue),
          subtitle: formattedMonthSubtitle,
          icon: CreditCard,
          variant: "default" as const,
        },
        {
          title: "Loyers Impayés",
          value: formatFCFA(totalUnpaid),
          subtitle: `${concernedTenantsCount} locataire(s) concerné(s)`,
          icon: AlertTriangle,
          variant: "destructive" as const,
        },
      ]);

      // 6. Charger les alertes
      const todayStr = new Date().toISOString().split("T")[0];
      const newAlerts: Array<{
        id: string;
        type: "payment" | "contract" | "maintenance";
        title: string;
        description: string;
        date: string;
      }> = [];

      // Charger les paiements en retard
      try {
        const { data: latePaymentsData, error: lateError } = await supabase
          .from("payments")
          .select(`
            id,
            amount,
            due_date,
            tenants (
              full_name
            )
          `)
          .eq("user_id", user.id)
          .in("status", ["en retard", "en attente"])
          .lt("due_date", todayStr)
          .order("due_date", { ascending: true })
          .limit(3);

        if (lateError) throw lateError;

        latePaymentsData?.forEach(p => {
          const tenantName = (p.tenants as any)?.full_name || "Locataire";
          const daysOverdue = Math.floor((new Date().getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24));
          
          newAlerts.push({
            id: `pay-${p.id}`,
            type: "payment" as const,
            title: "Loyer impayé",
            description: `${tenantName} - Loyer de ${formatFCFA(Number(p.amount))}`,
            date: daysOverdue === 0 ? "Aujourd'hui" : `Il y a ${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}`,
          });
        });
      } catch (err: any) {
        console.warn("Erreur lors du chargement des alertes de paiement:", err.message);
      }

      // Charger les contrats expirant bientôt
      try {
        const thirtyDaysFromNowStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const { data: expiringContractsData, error: contractError } = await supabase
          .from("contracts")
          .select("id, title, expires_at, tenant_name")
          .eq("user_id", user.id)
          .lte("expires_at", thirtyDaysFromNowStr)
          .order("expires_at", { ascending: true })
          .limit(3);

        if (contractError) throw contractError;

        expiringContractsData?.forEach(c => {
          if (c.expires_at) {
            const expDate = new Date(c.expires_at);
            const isExpired = expDate < new Date();
            const diffTime = expDate.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            newAlerts.push({
              id: `con-${c.id}`,
              type: "contract" as const,
              title: isExpired ? "Contrat expiré" : "Contrat expire bientôt",
              description: `${c.tenant_name} - ${c.title}`,
              date: isExpired ? "Dépassé" : `Dans ${diffDays} jour${diffDays > 1 ? "s" : ""}`,
            });
          }
        });
      } catch (err: any) {
        console.warn("Erreur lors du chargement des alertes de contrat:", err.message);
      }

      setAlerts(newAlerts);

      // 7. Charger les données financières des 6 derniers mois pour le graphique
      try {
        const monthsCount = 6;
        const chartStartDate = startOfMonth(subMonths(new Date(), monthsCount - 1));
        const chartEndDate = endOfMonth(new Date());

        const { data: chartPayments, error: chartPayErr } = await supabase
          .from("payments")
          .select("amount, paid_date")
          .eq("user_id", user.id)
          .eq("status", "payé")
          .gte("paid_date", chartStartDate.toISOString().split("T")[0])
          .lte("paid_date", chartEndDate.toISOString().split("T")[0]);

        if (chartPayErr) throw chartPayErr;

        const { data: chartExpenses, error: chartExpErr } = await supabase
          .from("expenses")
          .select("amount, expense_date")
          .eq("user_id", user.id)
          .gte("expense_date", chartStartDate.toISOString().split("T")[0])
          .lte("expense_date", chartEndDate.toISOString().split("T")[0]);

        if (chartExpErr) throw chartExpErr;

        const monthlyMap = new Map<string, { revenus: number; depenses: number }>();

        // Initialiser les 6 derniers mois
        for (let i = 0; i < monthsCount; i++) {
          const date = subMonths(new Date(), monthsCount - 1 - i);
          const monthLabel = format(date, "MMM", { locale: fr });
          const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
          monthlyMap.set(formattedLabel, { revenus: 0, depenses: 0 });
        }

        // Ajouter les revenus
        chartPayments?.forEach(p => {
          if (p.paid_date) {
            const monthLabel = format(new Date(p.paid_date), "MMM", { locale: fr });
            const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
            const current = monthlyMap.get(formattedLabel);
            if (current) {
              current.revenus += Number(p.amount);
            }
          }
        });

        // Ajouter les dépenses
        chartExpenses?.forEach(e => {
          if (e.expense_date) {
            const monthLabel = format(new Date(e.expense_date), "MMM", { locale: fr });
            const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
            const current = monthlyMap.get(formattedLabel);
            if (current) {
              current.depenses += Number(e.amount);
            }
          }
        });

        const formattedChartData = Array.from(monthlyMap.entries()).map(([month, val]) => ({
          month,
          revenus: val.revenus,
          depenses: val.depenses,
        }));

        setChartData(formattedChartData);
      } catch (err: any) {
        console.warn("Erreur lors du chargement des données financières pour le graphique:", err.message);
      }

    } catch (globalErr) {
      console.error("Erreur générale lors du chargement du tableau de bord:", globalErr);
    } finally {
      setLoading(false);
      setLoadingChart(false);
    }
  };

  const displayProperties = properties.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    address: p.address,
    status: p.status,
    tenants: tenantCounts[p.id] || 0,
    monthlyRent: p.monthly_rent,
    imageUrl: p.image_url,
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
        <RevenueChart data={chartData} loading={loadingChart} className="lg:col-span-2" />
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
