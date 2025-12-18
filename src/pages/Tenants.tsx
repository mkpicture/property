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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <Button variant="gradient">
          <Plus className="h-4 w-4" />
          Ajouter un locataire
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un locataire..." className="pl-10" />
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
            <span className="font-semibold text-foreground">
              {tenants.filter((t) => t.rentStatus === "payé").length}
            </span>{" "}
            à jour
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {tenants.filter((t) => t.rentStatus === "en retard").length}
            </span>{" "}
            en retard
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
              {tenants.map((tenant, index) => (
                <tr
                  key={tenant.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {tenant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {tenant.name}
                        </p>
                        <p className="text-sm text-muted-foreground md:hidden">
                          {tenant.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {tenant.phone}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {tenant.property}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      className={cn(
                        tenant.rentStatus === "payé"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                    >
                      {tenant.rentStatus === "payé" ? "À jour" : "En retard"}
                    </Badge>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {tenant.moveInDate}
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem>Historique paiements</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
