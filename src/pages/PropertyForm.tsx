import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatFCFA, parseCurrency } from "@/lib/currency";

interface PropertyFormData {
  name: string;
  type: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  status: "loué" | "vacant";
  monthly_rent: string;
  surface_area: string;
  rooms: string;
  description: string;
  image_url: string;
}

export default function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: "",
    type: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Côte d'Ivoire",
    status: "vacant",
    monthly_rent: "",
    surface_area: "",
    rooms: "",
    description: "",
    image_url: "",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && user) {
      loadProperty();
    }
  }, [id, user]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          type: data.type || "",
          address: data.address || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          country: data.country || "Côte d'Ivoire",
          status: data.status || "vacant",
          monthly_rent: data.monthly_rent?.toString() || "",
          surface_area: data.surface_area?.toString() || "",
          rooms: data.rooms?.toString() || "",
          description: data.description || "",
          image_url: data.image_url || "",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du bien:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le bien.",
        variant: "destructive",
      });
      navigate("/properties");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom du bien est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type.trim()) {
      toast({
        title: "Champ requis",
        description: "Le type de bien est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Champ requis",
        description: "L'adresse est requise.",
        variant: "destructive",
      });
      return;
    }

    const monthlyRent = parseCurrency(formData.monthly_rent);
    if (monthlyRent <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le loyer mensuel doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const propertyData = {
        user_id: user.id,
        name: formData.name.trim(),
        type: formData.type.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        country: formData.country || "Côte d'Ivoire",
        status: formData.status,
        monthly_rent: monthlyRent,
        surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
      };

      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", id)
          .eq("user_id", user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("properties")
          .insert(propertyData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Succès",
        description: isEditing
          ? "Le bien a été modifié avec succès."
          : "Le bien a été créé avec succès.",
      });

      navigate("/properties");
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/properties")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              {isEditing ? "Modifier le bien" : "Ajouter un bien"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing
                ? "Modifiez les informations de votre bien immobilier"
                : "Ajoutez un nouveau bien à votre portefeuille"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-soft space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Informations de base
              </h2>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du bien *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Résidence Les Jardins"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de bien *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appartement">Appartement</SelectItem>
                      <SelectItem value="Maison">Maison</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Immeuble">Immeuble</SelectItem>
                      <SelectItem value="Duplex">Duplex</SelectItem>
                      <SelectItem value="Loft">Loft</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "loué" | "vacant") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="loué">Loué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Adresse
              </h2>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète *</Label>
                <Input
                  id="address"
                  placeholder="Ex: 12 rue des Fleurs"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Abidjan"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="Ex: 01 BP"
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, postal_code: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Caractéristiques
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">Loyer mensuel (FCFA) *</Label>
                  <Input
                    id="monthly_rent"
                    type="text"
                    placeholder="Ex: 500000"
                    value={formData.monthly_rent}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_rent: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surface_area">Surface (m²)</Label>
                  <Input
                    id="surface_area"
                    type="number"
                    placeholder="Ex: 80"
                    value={formData.surface_area}
                    onChange={(e) =>
                      setFormData({ ...formData, surface_area: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rooms">Nombre de pièces</Label>
                  <Input
                    id="rooms"
                    type="number"
                    placeholder="Ex: 3"
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({ ...formData, rooms: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du bien..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de l'image</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/properties")}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading
                ? "Enregistrement..."
                : isEditing
                ? "Modifier"
                : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

