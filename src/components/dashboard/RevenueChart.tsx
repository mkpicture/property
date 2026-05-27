import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency, formatFCFA } from "@/lib/currency";

export interface MonthlyData {
  month: string;
  revenus: number;
  depenses: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
  loading?: boolean;
  className?: string;
}

export function RevenueChart({ data, loading, className }: RevenueChartProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 shadow-soft flex flex-col items-center justify-center h-[360px]", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <p className="text-sm text-muted-foreground">Chargement des données financières...</p>
      </div>
    );
  }

  const hasData = data && data.length > 0 && data.some(d => d.revenus > 0 || d.depenses > 0);
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-soft", className)}>
      <div className="mb-6">
        <h3 className="font-display font-semibold text-foreground">
          Revenus vs Dépenses
        </h3>
        <p className="text-sm text-muted-foreground">
          Évolution sur les 6 derniers mois
        </p>
      </div>
      <div className="h-64 flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(220, 15%, 50%)" }}
                axisLine={{ stroke: "hsl(210, 20%, 90%)" }}
                tickFormatter={(value) => formatCurrency(value, { showSymbol: false })}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 90%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px -4px hsl(220 30% 15% / 0.12)",
                }}
                formatter={(value: number) => [formatFCFA(value), ""]}
              />
              <Area
                type="monotone"
                dataKey="revenus"
                stroke="hsl(174, 62%, 38%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenus)"
                name="Revenus"
              />
              <Area
                type="monotone"
                dataKey="depenses"
                stroke="hsl(0, 72%, 51%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDepenses)"
                name="Dépenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Aucune donnée financière pour cette période.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez des paiements et des dépenses pour alimenter le graphique.</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Revenus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Dépenses</span>
        </div>
      </div>
    </div>
  );
}
