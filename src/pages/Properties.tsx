import { useState } from "react";
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

const properties = [
  {
    id: "1",
    name: "Résidence Les Jardins",
    type: "Immeuble · 8 unités",
    address: "12 rue des Fleurs, 75001 Paris",
    status: "loué" as const,
    tenants: 8,
    monthlyRent: 6400,
  },
  {
    id: "2",
    name: "Appartement Haussmann",
    type: "Appartement · T4",
    address: "45 avenue Victor Hugo, 75016 Paris",
    status: "loué" as const,
    tenants: 1,
    monthlyRent: 2200,
  },
  {
    id: "3",
    name: "Studio Saint-Michel",
    type: "Studio · 25m²",
    address: "8 rue de la Harpe, 75005 Paris",
    status: "vacant" as const,
    tenants: 0,
    monthlyRent: 850,
  },
  {
    id: "4",
    name: "Maison de Ville",
    type: "Maison · 5 pièces",
    address: "23 allée des Roses, 92100 Boulogne",
    status: "loué" as const,
    tenants: 1,
    monthlyRent: 3200,
  },
  {
    id: "5",
    name: "Loft Bastille",
    type: "Loft · 80m²",
    address: "15 rue de Lappe, 75011 Paris",
    status: "loué" as const,
    tenants: 2,
    monthlyRent: 1800,
  },
  {
    id: "6",
    name: "Duplex Montmartre",
    type: "Duplex · T3",
    address: "28 rue Lepic, 75018 Paris",
    status: "vacant" as const,
    tenants: 0,
    monthlyRent: 1650,
  },
];

export default function Properties() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      {filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display font-semibold text-foreground">
            Aucune propriété trouvée
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Essayez de modifier vos filtres ou ajoutez un nouveau bien.
          </p>
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
            <PropertyCard key={property.id} {...property} delay={index * 50} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
