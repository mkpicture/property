import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Building2, Grid3X3, List } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  status: "loué" | "vacant";
  monthly_rent: number;
  image_url?: string;
}

export default function Properties() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase lors du chargement des propriétés:", error);
        setProperties([]);
        return;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error("Erreur inattendue lors du chargement des propriétés:", error);
      // En cas d'erreur, on garde un tableau vide pour éviter les crashes
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Compter les locataires pour chaque propriété
  const [tenantCounts, setTenantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && properties.length > 0) {
      loadTenantCounts();
    }
  }, [user, properties]);

  const loadTenantCounts = async () => {
    if (!user || properties.length === 0) {
      setTenantCounts({});
      return;
    }
    
    try {
      const propertyIds = properties.map(p => p.id);
      if (propertyIds.length === 0) {
        setTenantCounts({});
        return;
      }
      const { data, error } = await supabase
        .from("tenants")
        .select("property_id")
        .eq("user_id", user.id)
        .in("property_id", propertyIds)
        .is("move_out_date", null);

      if (error) {
        console.error("Erreur Supabase lors du chargement des compteurs:", error);
        setTenantCounts({});
        return;
      }

      const counts: Record<string, number> = {};
      propertyIds.forEach(id => {
        counts[id] = 0;
      });
      
      data?.forEach(tenant => {
        if (tenant.property_id) {
          counts[tenant.property_id] = (counts[tenant.property_id] || 0) + 1;
        }
      });

      setTenantCounts(counts);
    } catch (error: any) {
      console.error("Erreur inattendue lors du chargement des compteurs de locataires:", error);
      // En cas d'erreur, on garde un objet vide
      setTenantCounts({});
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Propriétés
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez l'ensemble de vos biens immobiliers
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/properties/new">
            <Plus className="h-4 w-4" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bien..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="loué">Loués</SelectItem>
            <SelectItem value="vacant">Vacants</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border bg-card p-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              viewMode === "grid" && "bg-muted"
            )}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              viewMode === "list" && "bg-muted"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{properties.length}</span> propriétés
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {properties.filter((p) => p.status === "loué").length}
            </span>{" "}
            loués
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {properties.filter((p) => p.status === "vacant").length}
            </span>{" "}
            vacants
          </span>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
          <p className="text-sm text-muted-foreground">Chargement des propriétés...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display font-semibold text-foreground">
            {properties.length === 0 ? "Aucune propriété" : "Aucune propriété trouvée"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length === 0
              ? "Commencez par ajouter votre premier bien immobilier."
              : "Essayez de modifier vos filtres ou ajoutez un nouveau bien."}
          </p>
          {properties.length === 0 && (
            <Button variant="gradient" className="mt-4" asChild>
              <Link to="/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bien
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {filteredProperties.map((property, index) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              name={property.name}
              type={property.type}
              address={property.address}
              status={property.status}
              tenants={tenantCounts[property.id] || 0}
              monthlyRent={property.monthly_rent}
              imageUrl={property.image_url}
              delay={index * 50}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
