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

const data = [
  { month: "Jan", revenus: 4200, depenses: 1200 },
  { month: "Fév", revenus: 4500, depenses: 1400 },
  { month: "Mar", revenus: 4300, depenses: 1100 },
  { month: "Avr", revenus: 4800, depenses: 1600 },
  { month: "Mai", revenus: 5200, depenses: 1300 },
  { month: "Juin", revenus: 5000, depenses: 1500 },
];

interface RevenueChartProps {
  className?: string;
}

export function RevenueChart({ className }: RevenueChartProps) {
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
      <div className="h-64">
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
