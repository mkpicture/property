import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Receipt,
  TrendingDown,
  Calendar,
  Building2,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA, parseCurrency } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Expense {
  id: string;
  property_id: string | null;
  property_name?: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
}

const categories = [
  { value: "maintenance", label: "Maintenance" },
  { value: "réparation", label: "Réparation" },
  { value: "amélioration", label: "Amélioration" },
  { value: "taxes", label: "Taxes" },
  { value: "assurance", label: "Assurance" },
  { value: "utilitaires", label: "Utilitaires" },
  { value: "gestion", label: "Gestion" },
  { value: "marketing", label: "Marketing" },
  { value: "juridique", label: "Juridique" },
  { value: "autre", label: "Autre" },
];

export default function Expenses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    category: "",
    description: "",
    amount: "",
    expense_date: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
      loadProperties();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          properties:property_id (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });

      if (error) throw error;

      const formattedExpenses = (data || []).map((expense: any) => ({
        ...expense,
        property_name: expense.properties?.name || null,
      }));

      setExpenses(formattedExpenses);
    } catch (error: any) {
      console.error("Erreur lors du chargement des dépenses:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des propriétés:", error);
    }
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        property_id: expense.property_id || "",
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString(),
        expense_date: expense.expense_date.split("T")[0],
        notes: expense.notes || "",
      });
    } else {
      setEditingExpense(null);
      setFormData({
        property_id: "",
        category: "",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    setFormData({
      property_id: "",
      category: "",
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.category) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner une catégorie.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir une description.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseCurrency(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.expense_date) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner une date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        user_id: user.id,
        property_id: formData.property_id || null,
        category: formData.category,
        description: formData.description.trim(),
        amount: amount,
        expense_date: formData.expense_date,
        notes: formData.notes.trim() || null,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La dépense a été modifiée avec succès.",
        });
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert(expenseData);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La dépense a été créée avec succès.",
        });
      }

      handleCloseDialog();
      loadExpenses();
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!user) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La dépense a été supprimée avec succès.",
      });

      loadExpenses();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense.",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Dépenses
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos dépenses immobilières
          </p>
        </div>
        <Button variant="gradient" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4" />
          Ajouter une dépense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft">
          <div className="rounded-xl p-3 bg-destructive/10">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total des dépenses</p>
            <p className="text-xl font-display font-bold text-foreground">
              {formatFCFA(totalExpenses)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-soft">
          <div className="rounded-xl p-3 bg-warning/10">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dépenses ce mois</p>
            <p className="text-xl font-display font-bold text-foreground">
              {formatFCFA(thisMonthExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une dépense..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Description
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">
                  Propriété
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Catégorie
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Montant
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">
                  Date
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Aucune dépense trouvée
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {expense.description}
                        </p>
                        <p className="text-sm text-muted-foreground lg:hidden">
                          {expense.property_name || "Aucune propriété"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                      {expense.property_name || "-"}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {categories.find((c) => c.value === expense.category)?.label ||
                          expense.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-display font-semibold text-destructive">
                        {formatFCFA(expense.amount)}
                      </p>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(expense.expense_date), "d MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(expense.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog pour ajouter/modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Modifier la dépense" : "Ajouter une dépense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Modifiez les informations de la dépense"
                : "Ajoutez une nouvelle dépense à votre portefeuille"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Propriété (optionnel)</label>
              <Select
                value={formData.property_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, property_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune propriété</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                placeholder="Ex: Réparation de la plomberie"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Montant (FCFA) *</label>
              <Input
                type="text"
                placeholder="Ex: 50000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Input
                placeholder="Notes supplémentaires..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Annuler
              </Button>
              <Button type="submit" variant="gradient">
                {editingExpense ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

