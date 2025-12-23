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

interface Payment {
  id: string;
  tenant_id: string;
  property_id: string;
  tenant_name?: string;
  property_name?: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "en attente" | "payé" | "en retard";
  payment_method: string | null;
  notes: string | null;
}

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    pending: 0,
    overdue: 0,
  });

  useEffect(() => {
    if (user) {
      loadPayments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPayments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Charger les paiements avec les noms des locataires et propriétés
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          tenants:tenant_id(full_name),
          properties:property_id(name)
        `)
        .eq("user_id", user.id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      // Transformer les données pour inclure les noms
      const formattedPayments = (data || []).map((payment: any) => ({
        ...payment,
        tenant_name: payment.tenants?.full_name || "Locataire inconnu",
        property_name: payment.properties?.name || "Propriété inconnue",
      }));

      setPayments(formattedPayments);

      // Calculer les statistiques
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyRevenue = formattedPayments
        .filter((p: Payment) => {
          if (p.status !== "payé" || !p.paid_date) return false;
          const paidDate = new Date(p.paid_date);
          return (
            paidDate.getMonth() === currentMonth &&
            paidDate.getFullYear() === currentYear
          );
        })
        .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

      const pending = formattedPayments
        .filter((p: Payment) => p.status === "en attente")
        .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

      const overdue = formattedPayments
        .filter((p: Payment) => {
          if (p.status !== "en retard") return false;
          const dueDate = new Date(p.due_date);
          return dueDate < now;
        })
        .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

      setStats({ monthlyRevenue, pending, overdue });
    } catch (error: any) {
      console.error("Erreur lors du chargement des paiements:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le paiement a été supprimé avec succès.",
      });

      loadPayments();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paiement.",
        variant: "destructive",
      });
    }
  };

  const displayStats = [
    {
      label: "Revenus du mois",
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "En attente",
      value: formatCurrency(stats.pending),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "En retard",
      value: formatCurrency(stats.overdue),
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  // Filtrer les paiements selon la recherche
  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.toLowerCase();
    return (
      payment.tenant_name?.toLowerCase().includes(query) ||
      payment.property_name?.toLowerCase().includes(query) ||
      payment.amount.toString().includes(query)
    );
  });
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
        <Button variant="gradient" onClick={() => navigate("/payments/new")}>
          <Plus className="h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {displayStats.map((stat, index) => (
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
          <Input
            placeholder="Rechercher un paiement..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden sm:table-cell">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Aucun paiement trouvé"
                        : "Aucun paiement enregistré"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.tenant_name}
                      </p>
                      <p className="text-sm text-muted-foreground lg:hidden">
                        {payment.property_name}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                    {payment.property_name}
                  </td>
                  <td className="p-4">
                    <p className="font-display font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                    {payment.due_date
                      ? format(new Date(payment.due_date), "d MMM yyyy", {
                          locale: fr,
                        })
                      : "-"}
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
                    <div className="flex items-center gap-2">
                      <span>{payment.payment_method || "-"}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            navigate(`/payments/${payment.id}/edit`)
                          }
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Supprimer le paiement ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le paiement sera
                                définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(payment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
