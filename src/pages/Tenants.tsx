import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/currency";

interface Tenant {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  property_id: string | null;
  property_name?: string;
  monthly_rent: number;
  move_in_date: string | null;
  move_out_date: string | null;
}

const tenants = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean.dupont@email.com",
    phone: "+33 6 12 34 56 78",
    property: "Appartement Haussmann",
    status: "actif",
    rentStatus: "payé",
    moveInDate: "15 Jan 2023",
  },
  {
    id: "2",
    name: "Marie Martin",
    email: "marie.martin@email.com",
    phone: "+33 6 98 76 54 32",
    property: "Résidence Les Jardins - Apt 3",
    status: "actif",
    rentStatus: "en retard",
    moveInDate: "1 Mar 2022",
  },
  {
    id: "3",
    name: "Pierre Bernard",
    email: "pierre.bernard@email.com",
    phone: "+33 6 55 44 33 22",
    property: "Résidence Les Jardins - Apt 1",
    status: "actif",
    rentStatus: "payé",
    moveInDate: "10 Sep 2023",
  },
  {
    id: "4",
    name: "Sophie Laurent",
    email: "sophie.laurent@email.com",
    phone: "+33 6 11 22 33 44",
    property: "Maison de Ville",
    status: "actif",
    rentStatus: "payé",
    moveInDate: "1 Jun 2021",
  },
  {
    id: "5",
    name: "Thomas Petit",
    email: "thomas.petit@email.com",
    phone: "+33 6 77 88 99 00",
    property: "Loft Bastille",
    status: "actif",
    rentStatus: "en retard",
    moveInDate: "15 Nov 2023",
  },
];

export default function Tenants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      loadTenants();
    }
  }, [user]);

  const loadTenants = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          properties:property_id (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTenants = (data || []).map((tenant: any) => ({
        ...tenant,
        property_name: tenant.properties?.name || null,
      }));

      setTenants(formattedTenants);
    } catch (error: any) {
      console.error("Erreur lors du chargement des locataires:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les locataires.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!user) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le locataire a été supprimé avec succès.",
      });

      loadTenants();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le locataire.",
        variant: "destructive",
      });
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const search = searchTerm.toLowerCase();
    return (
      tenant.full_name.toLowerCase().includes(search) ||
      tenant.email?.toLowerCase().includes(search) ||
      tenant.phone?.toLowerCase().includes(search) ||
      tenant.property_name?.toLowerCase().includes(search)
    );
  });

  const activeTenants = tenants.filter((t) => !t.move_out_date);
  const paidTenants = activeTenants.length; // TODO: Calculer les locataires à jour de paiement
  const overdueTenants = 0; // TODO: Calculer les locataires en retard

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Locataires
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos locataires et leur historique
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/tenants/new">
            <Plus className="h-4 w-4" />
            Ajouter un locataire
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un locataire..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{tenants.length}</span>{" "}
            locataires
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{activeTenants.length}</span>{" "}
            actifs
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {tenants.filter((t) => t.move_out_date).length}
            </span>{" "}
            inactifs
          </span>
        </div>
      </div>

      {/* Tenants List */}
      <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Locataire
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">
                  Propriété
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  Statut loyer
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm hidden sm:table-cell">
                  Entrée
                </th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="font-display font-semibold text-foreground">
                      Aucun locataire trouvé
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm
                        ? "Essayez de modifier votre recherche."
                        : "Ajoutez votre premier locataire."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant, index) => (
                  <tr
                    key={tenant.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {tenant.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {tenant.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground md:hidden">
                            {tenant.email || tenant.phone || "Aucun contact"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        {tenant.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {tenant.email}
                          </div>
                        )}
                        {tenant.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {tenant.phone}
                          </div>
                        )}
                        {!tenant.email && !tenant.phone && (
                          <span className="text-sm text-muted-foreground">Aucun contact</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {tenant.property_name || "Aucune propriété"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={cn(
                          tenant.move_out_date
                            ? "bg-muted text-muted-foreground"
                            : "bg-success/10 text-success hover:bg-success/20"
                        )}
                      >
                        {tenant.move_out_date ? "Inactif" : "Actif"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFCFA(tenant.monthly_rent)}/mois
                      </p>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">
                      {tenant.move_in_date
                        ? new Date(tenant.move_in_date).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/tenants/${tenant.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(tenant.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
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
    </DashboardLayout>
  );
}
