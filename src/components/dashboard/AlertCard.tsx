import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, FileWarning, LucideIcon } from "lucide-react";

interface Alert {
  id: string;
  type: "payment" | "contract" | "maintenance";
  title: string;
  description: string;
  date: string;
}

interface AlertCardProps {
  alerts: Alert[];
  className?: string;
}

const alertIcons: Record<Alert["type"], LucideIcon> = {
  payment: AlertTriangle,
  contract: FileWarning,
  maintenance: Clock,
};

const alertStyles: Record<Alert["type"], string> = {
  payment: "bg-destructive/10 text-destructive",
  contract: "bg-warning/10 text-warning",
  maintenance: "bg-primary/10 text-primary",
};

export function AlertCard({ alerts, className }: AlertCardProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 shadow-soft", className)}>
        <h3 className="font-display font-semibold text-foreground mb-4">
          Alertes
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune alerte pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-soft", className)}>
      <h3 className="font-display font-semibold text-foreground mb-4">
        Alertes ({alerts.length})
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = alertIcons[alert.type];
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("rounded-lg p-2", alertStyles[alert.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {alert.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {alert.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {alert.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
