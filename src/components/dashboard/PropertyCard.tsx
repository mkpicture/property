import { cn } from "@/lib/utils";
import { MapPin, Users, Home, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/currency";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  name: string;
  type: string;
  address: string;
  status: "loué" | "vacant";
  tenants?: number;
  monthlyRent?: number;
  imageUrl?: string;
  delay?: number;
}

export function PropertyCard({
  name,
  type,
  address,
  status,
  tenants = 0,
  monthlyRent,
  imageUrl,
  delay = 0,
}: PropertyCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Home className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <Badge
          className={cn(
            "absolute right-3 top-3",
            status === "loué"
              ? "bg-success text-success-foreground"
              : "bg-warning text-warning-foreground"
          )}
        >
          {status === "loué" ? "Loué" : "Vacant"}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-foreground line-clamp-1">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{type}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{tenants} locataire{tenants !== 1 ? "s" : ""}</span>
          </div>
          {monthlyRent && (
            <p className="font-display font-semibold text-primary">
              {formatFCFA(monthlyRent)}/mois
            </p>
          )}
        </div>
        
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={`/properties/${id}/edit`}>
              <Edit className="h-3 w-3 mr-2" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
