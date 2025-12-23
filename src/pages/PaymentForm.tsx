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
import { useCurrency } from "@/contexts/CurrencyContext";
import { parseCurrency } from "@/lib/currency";

interface PaymentFormData {
  tenant_id: string;
  property_id: string;
  amount: string;
  due_date: string;
  paid_date: string;
  status: "en attente" | "payé" | "en retard";
  payment_method: string;
  notes: string;
}

export default function PaymentForm() {
  const params = useParams<{ id?: string }>();
  const id: string | undefined = params?.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; full_name: string; property_id: string }>>([]);
  const [properties, setProperties] = useState<Array<{ id: string; name: string; monthly_rent: number }>>([]);
  const [formData, setFormData] = useState<PaymentFormData>({
    tenant_id: "",
    property_id: "",
    amount: "",
    due_date: "",
    paid_date: "",
    status: "en attente",
    payment_method: "",
    notes: "",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (user) {
      loadTenants();
      loadProperties();
      if (isEditing && id) {
        loadPayment();
      }
    }
  }, [user, id, isEditing]);

  const loadTenants = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, full_name, property_id")
        .eq("user_id", user.id)
        .is("move_out_date", null)
        .order("full_name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des locataires:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les locataires.",
        variant: "destructive",
      });
    }
  };

  const loadProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, monthly_rent")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des propriétés:", error);
    }
  };

  const loadPayment = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          tenant_id: data.tenant_id || "",
          property_id: data.property_id || "",
          amount: data.amount?.toString() || "",
          due_date: data.due_date ? data.due_date.split("T")[0] : "",
          paid_date: data.paid_date ? data.paid_date.split("T")[0] : "",
          status: data.status || "en attente",
          payment_method: data.payment_method || "",
          notes: data.notes || "",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du paiement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le paiement.",
        variant: "destructive",
      });
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setFormData({ ...formData, property_id: propertyId });
    
    // Filtrer les locataires pour cette propriété
    const propertyTenants = tenants.filter(t => t.property_id === propertyId);
    
    // Si un seul locataire, le sélectionner automatiquement
    if (propertyTenants.length === 1) {
      setFormData({ ...formData, property_id: propertyId, tenant_id: propertyTenants[0].id });
    } else {
      setFormData({ ...formData, property_id: propertyId, tenant_id: "" });
    }

    // Remplir le montant avec le loyer mensuel de la propriété
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setFormData(prev => ({ ...prev, property_id: propertyId, amount: property.monthly_rent.toString() }));
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setFormData({ ...formData, tenant_id: tenantId, property_id: tenant.property_id });
      
      // Remplir le montant avec le loyer de la propriété du locataire
      const property = properties.find(p => p.id === tenant.property_id);
      if (property) {
        setFormData(prev => ({ ...prev, tenant_id: tenantId, property_id: tenant.property_id, amount: property.monthly_rent.toString() }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.tenant_id || !formData.property_id || !formData.amount || !formData.due_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        user_id: user.id,
        tenant_id: formData.tenant_id,
        property_id: formData.property_id,
        amount: parseCurrency(formData.amount),
        due_date: formData.due_date,
        paid_date: formData.paid_date || null,
        status: formData.status,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      if (isEditing && id) {
        const { error } = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le paiement a été mis à jour avec succès.",
        });
      } else {
        const { error } = await supabase
          .from("payments")
          .insert(paymentData);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le paiement a été enregistré avec succès.",
        });
      }

      navigate("/payments");
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les locataires selon la propriété sélectionnée
  const availableTenants = formData.property_id
    ? tenants.filter(t => t.property_id === formData.property_id)
    : tenants;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/payments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              {isEditing ? "Modifier le paiement" : "Nouveau paiement"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing
                ? "Modifiez les informations du paiement"
                : "Enregistrez un nouveau paiement de loyer"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Propriété */}
            <div className="space-y-2">
              <Label htmlFor="property_id">
                Propriété <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.property_id}
                onValueChange={handlePropertyChange}
                required
              >
                <SelectTrigger id="property_id">
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
            </div>

            {/* Locataire */}
            <div className="space-y-2">
              <Label htmlFor="tenant_id">
                Locataire <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tenant_id}
                onValueChange={handleTenantChange}
                required
                disabled={!formData.property_id}
              >
                <SelectTrigger id="tenant_id">
                  <SelectValue placeholder="Sélectionner un locataire" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.property_id && (
                <p className="text-xs text-muted-foreground">
                  Sélectionnez d'abord une propriété
                </p>
              )}
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Montant <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0"
                required
              />
              {formData.amount && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseCurrency(formData.amount))}
                </p>
              )}
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <Label htmlFor="due_date">
                Date d'échéance <span className="text-destructive">*</span>
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>

            {/* Date de paiement */}
            <div className="space-y-2">
              <Label htmlFor="paid_date">Date de paiement</Label>
              <Input
                id="paid_date"
                type="date"
                value={formData.paid_date}
                onChange={(e) =>
                  setFormData({ ...formData, paid_date: e.target.value })
                }
              />
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "en attente" | "payé" | "en retard",
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="payé">Payé</SelectItem>
                  <SelectItem value="en retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Méthode de paiement</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes supplémentaires..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/payments")}
            >
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading
                ? "Enregistrement..."
                : isEditing
                ? "Mettre à jour"
                : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

