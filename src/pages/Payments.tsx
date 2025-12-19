import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/lib/currency";

const payments = [
  {
    id: "1",
    tenant: "Jean Dupont",
    property: "Appartement Haussmann",
    amount: 2200,
    dueDate: "1 Mai 2024",
    paidDate: "28 Avr 2024",
    status: "payé",
    method: "Virement",
  },
  {
    id: "2",
    tenant: "Marie Martin",
    property: "Résidence Les Jardins - Apt 3",
    amount: 850,
    dueDate: "1 Mai 2024",
    paidDate: null,
    status: "en retard",
    method: null,
  },
  {
    id: "3",
    tenant: "Pierre Bernard",
    property: "Résidence Les Jardins - Apt 1",
    amount: 920,
    dueDate: "1 Mai 2024",
    paidDate: "1 Mai 2024",
    status: "payé",
    method: "Mobile Money",
  },
  {
    id: "4",
    tenant: "Sophie Laurent",
    property: "Maison de Ville",
    amount: 3200,
    dueDate: "1 Mai 2024",
    paidDate: "30 Avr 2024",
    status: "payé",
    method: "Virement",
  },
  {
    id: "5",
    tenant: "Thomas Petit",
    property: "Loft Bastille",
    amount: 1800,
    dueDate: "1 Mai 2024",
    paidDate: null,
    status: "en attente",
    method: null,
  },
];

const stats = [
  {
    label: "Revenus du mois",
    value: formatFCFA(15800),
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "En attente",
    value: formatFCFA(1800),
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    label: "En retard",
    value: formatFCFA(850),
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

export default function Payments() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Paiements
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les loyers et paiements de vos locataires
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn("rounded-xl p-3", stat.bgColor)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-display font-bold text-foreground">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un paiement..." className="pl-10" />
        </div>
      </div>

      {/* Payments List */}
      <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Locataire
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">
                  Propriété
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Montant
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">
                  Échéance
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Statut
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden sm:table-cell">
                  Méthode
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.tenant}
                      </p>
                      <p className="text-sm text-muted-foreground lg:hidden">
                        {payment.property}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                    {payment.property}
                  </td>
                  <td className="p-4">
                    <p className="font-display font-semibold text-foreground">
                      {formatFCFA(payment.amount)}
                    </p>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                    {payment.dueDate}
                  </td>
                  <td className="p-4">
                    <Badge
                      className={cn(
                        "gap-1",
                        payment.status === "payé" &&
                          "bg-success/10 text-success hover:bg-success/20",
                        payment.status === "en attente" &&
                          "bg-warning/10 text-warning hover:bg-warning/20",
                        payment.status === "en retard" &&
                          "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                    >
                      {payment.status === "payé" && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {payment.status === "en attente" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {payment.status === "en retard" && (
                        <XCircle className="h-3 w-3" />
                      )}
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {payment.method || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
