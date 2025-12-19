import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatFCFA } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  revenus: number;
  depenses: number;
  benefice: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = [
  "hsl(174, 62%, 38%)",
  "hsl(0, 72%, 51%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 100%, 70%)",
  "hsl(0, 0%, 50%)",
];

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, period]);

  const loadReports = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const months = parseInt(period);
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      const endDate = endOfMonth(new Date());

      // Charger les paiements
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, paid_date")
        .eq("user_id", user.id)
        .eq("status", "payé")
        .gte("paid_date", startDate.toISOString().split("T")[0])
        .lte("paid_date", endDate.toISOString().split("T")[0]);

      if (paymentsError) throw paymentsError;

      // Charger les dépenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, expense_date, category")
        .eq("user_id", user.id)
        .gte("expense_date", startDate.toISOString().split("T")[0])
        .lte("expense_date", endDate.toISOString().split("T")[0]);

      if (expensesError) throw expensesError;

      // Calculer les données mensuelles
      const monthlyMap = new Map<string, { revenus: number; depenses: number }>();

      // Initialiser tous les mois
      for (let i = 0; i < months; i++) {
        const date = subMonths(new Date(), months - 1 - i);
        const monthKey = format(date, "MMM yyyy", { locale: fr });
        monthlyMap.set(monthKey, { revenus: 0, depenses: 0 });
      }

      // Ajouter les revenus
      payments?.forEach((payment) => {
        if (payment.paid_date) {
          const date = new Date(payment.paid_date);
          const monthKey = format(date, "MMM yyyy", { locale: fr });
          const current = monthlyMap.get(monthKey);
          if (current) {
            current.revenus += Number(payment.amount);
          }
        }
      });

      // Ajouter les dépenses
      expenses?.forEach((expense) => {
        const date = new Date(expense.expense_date);
        const monthKey = format(date, "MMM yyyy", { locale: fr });
        const current = monthlyMap.get(monthKey);
        if (current) {
          current.depenses += Number(expense.amount);
        }
      });

      // Convertir en tableau et calculer les bénéfices
      const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(
        ([month, data]) => ({
          month,
          revenus: data.revenus,
          depenses: data.depenses,
          benefice: data.revenus - data.depenses,
        })
      );

      setMonthlyData(monthlyArray);

      // Calculer les totaux
      const totalRev = monthlyArray.reduce((sum, m) => sum + m.revenus, 0);
      const totalExp = monthlyArray.reduce((sum, m) => sum + m.depenses, 0);
      setTotalRevenue(totalRev);
      setTotalExpenses(totalExp);
      setNetProfit(totalRev - totalExp);

      // Calculer les catégories de dépenses
      const categoryMap = new Map<string, number>();
      expenses?.forEach((expense) => {
        const category = expense.category || "autre";
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Number(expense.amount));
      });

      const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setExpenseCategories(categoryArray);
    } catch (error: any) {
      console.error("Erreur lors du chargement des rapports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Créer un CSV simple
    const csv = [
      ["Mois", "Revenus", "Dépenses", "Bénéfice"],
      ...monthlyData.map((m) => [
        m.month,
        m.revenus.toString(),
        m.depenses.toString(),
        m.benefice.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-financier-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Rapports Financiers
          </h1>
          <p className="text-muted-foreground mt-1">
            Analysez vos revenus, dépenses et bénéfices
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 derniers mois</SelectItem>
              <SelectItem value="6">6 derniers mois</SelectItem>
              <SelectItem value="12">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft">
          <div className="rounded-xl p-3 bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenus</p>
            <p className="text-xl font-display font-bold text-foreground">
              {formatFCFA(totalRevenue)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft">
          <div className="rounded-xl p-3 bg-destructive/10">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Dépenses</p>
            <p className="text-xl font-display font-bold text-foreground">
              {formatFCFA(totalExpenses)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft">
          <div className="rounded-xl p-3 bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bénéfice Net</p>
            <p
              className={cn(
                "text-xl font-display font-bold",
                netProfit >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatFCFA(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenus vs Dépenses */}
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <div className="mb-6">
              <h3 className="font-display font-semibold text-foreground">
                Revenus vs Dépenses
              </h3>
              <p className="text-sm text-muted-foreground">
                Évolution sur {period} mois
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                    axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                    axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
                    tickFormatter={(value) => formatFCFA(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(210, 20%, 90%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatFCFA(value)}
                  />
                  <Legend />
                  <Bar dataKey="revenus" fill="hsl(174, 62%, 38%)" name="Revenus" />
                  <Bar dataKey="depenses" fill="hsl(0, 72%, 51%)" name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bénéfice Net */}
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <div className="mb-6">
              <h3 className="font-display font-semibold text-foreground">
                Bénéfice Net
              </h3>
              <p className="text-sm text-muted-foreground">
                Évolution sur {period} mois
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                    axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                    axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
                    tickFormatter={(value) => formatFCFA(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(210, 20%, 90%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatFCFA(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="benefice"
                    stroke="hsl(174, 62%, 38%)"
                    strokeWidth={2}
                    name="Bénéfice Net"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Catégories de dépenses */}
          {expenseCategories.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-soft lg:col-span-2">
              <div className="mb-6">
                <h3 className="font-display font-semibold text-foreground">
                  Répartition des Dépenses par Catégorie
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sur {period} mois
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatFCFA(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

