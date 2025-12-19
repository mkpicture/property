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

interface TenantFormData {
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  address: string;
  property_id: string;
  monthly_rent: string;
  payment_day: string;
  move_in_date: string;
  move_out_date: string;
  notes: string;
}

export default function TenantForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<TenantFormData>({
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    address: "",
    property_id: "",
    monthly_rent: "",
    payment_day: "1",
    move_in_date: "",
    move_out_date: "",
    notes: "",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (user) {
      loadProperties();
      if (isEditing) {
        loadTenant();
      }
    }
  }, [id, user]);

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

  const loadTenant = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          id_number: data.id_number || "",
          address: data.address || "",
          property_id: data.property_id || "",
          monthly_rent: data.monthly_rent?.toString() || "",
          payment_day: data.payment_day?.toString() || "1",
          move_in_date: data.move_in_date ? data.move_in_date.split("T")[0] : "",
          move_out_date: data.move_out_date ? data.move_out_date.split("T")[0] : "",
          notes: data.notes || "",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du locataire:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le locataire.",
        variant: "destructive",
      });
      navigate("/tenants");
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
    if (!formData.full_name.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom complet est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.property_id) {
      toast({
        title: "Champ requis",
        description: "La propriété est requise.",
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

    const paymentDay = parseInt(formData.payment_day);
    if (paymentDay < 1 || paymentDay > 31) {
      toast({
        title: "Jour invalide",
        description: "Le jour de paiement doit être entre 1 et 31.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const tenantData: any = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        id_number: formData.id_number.trim() || null,
        address: formData.address.trim() || null,
        property_id: formData.property_id || null,
        monthly_rent: monthlyRent,
        payment_day: paymentDay,
        move_in_date: formData.move_in_date || null,
        move_out_date: formData.move_out_date || null,
        notes: formData.notes.trim() || null,
      };

      let error;
      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from("tenants")
          .update(tenantData)
          .eq("id", id)
          .eq("user_id", user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("tenants")
          .insert(tenantData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Succès",
        description: isEditing
          ? "Le locataire a été modifié avec succès."
          : "Le locataire a été créé avec succès.",
      });

      navigate("/tenants");
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
            onClick={() => navigate("/tenants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              {isEditing ? "Modifier le locataire" : "Ajouter un locataire"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing
                ? "Modifiez les informations du locataire"
                : "Ajoutez un nouveau locataire à votre portefeuille"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-soft space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Informations personnelles
              </h2>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input
                  id="full_name"
                  placeholder="Ex: Jean Dupont"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: jean.dupont@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: +225 07 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                  <Input
                    id="id_number"
                    placeholder="Ex: CI-1234567890"
                    value={formData.id_number}
                    onChange={(e) =>
                      setFormData({ ...formData, id_number: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Ex: 12 rue des Fleurs, Abidjan"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Informations de location */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Informations de location
              </h2>

              <div className="space-y-2">
                <Label htmlFor="property_id">Propriété *</Label>
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
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {properties.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune propriété disponible.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/properties/new")}
                      className="text-primary hover:underline"
                    >
                      Créer une propriété
                    </button>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="payment_day">Jour de paiement (1-31) *</Label>
                  <Input
                    id="payment_day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 1"
                    value={formData.payment_day}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_day: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="move_in_date">Date d'entrée</Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) =>
                      setFormData({ ...formData, move_in_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="move_out_date">Date de sortie</Label>
                  <Input
                    id="move_out_date"
                    type="date"
                    value={formData.move_out_date}
                    onChange={(e) =>
                      setFormData({ ...formData, move_out_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes supplémentaires sur le locataire..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tenants")}
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

