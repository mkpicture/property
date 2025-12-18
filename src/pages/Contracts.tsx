import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  FileText,
  Upload,
  Download,
  Trash2,
  Calendar,
  User,
  Building2,
  File,
  FileType,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

interface Contract {
  id: string;
  title: string;
  tenant_name: string;
  property_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  expires_at?: string;
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    tenant_name: "",
    property_name: "",
    expires_at: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  const loadContracts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les contrats.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const allowedExtensions = [".pdf", ".doc", ".docx"];

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        toast({
          title: "Type de fichier invalide",
          description: "Veuillez sélectionner un fichier PDF ou Word (.pdf, .doc, .docx)",
          variant: "destructive",
        });
        return;
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 10MB",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.file) return;

    setUploading(true);

    try {
      // Générer un nom de fichier unique
      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload du fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(fileName, formData.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique du fichier
      const {
        data: { publicUrl },
      } = supabase.storage.from("contracts").getPublicUrl(fileName);

      // Enregistrer les métadonnées dans la base de données
      const { error: dbError } = await supabase.from("contracts").insert({
        user_id: user.id,
        title: formData.title,
        tenant_name: formData.tenant_name,
        property_name: formData.property_name,
        file_path: fileName,
        file_url: publicUrl,
        file_type: formData.file.type || `application/${fileExt}`,
        file_size: formData.file.size,
        file_name: formData.file.name,
        expires_at: formData.expires_at || null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Contrat ajouté",
        description: "Le contrat a été enregistré avec succès.",
      });

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        tenant_name: "",
        property_name: "",
        expires_at: "",
        file: null,
      });
      setIsDialogOpen(false);
      loadContracts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le contrat.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (contract: Contract) => {
    try {
      const { data, error } = await supabase.storage
        .from("contracts")
        .download(contract.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract.file_path.split("/").pop() || "contrat";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) return;

    try {
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from("contracts")
        .remove([contract.file_path]);

      if (storageError) throw storageError;

      // Supprimer l'enregistrement de la base de données
      const { error: dbError } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contract.id);

      if (dbError) throw dbError;

      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès.",
      });

      loadContracts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contrat.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("word") || fileType.includes("msword") || fileType.includes("document")) return FileType;
    return File;
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.property_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Contrats
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous vos contrats de location en un seul endroit
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Ajouter un contrat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau contrat</DialogTitle>
              <DialogDescription>
                Téléchargez un contrat au format PDF ou Word (.pdf, .doc, .docx)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du contrat *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Contrat de location - Appartement T3"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">Nom du locataire *</Label>
                  <Input
                    id="tenant_name"
                    placeholder="Jean Dupont"
                    value={formData.tenant_name}
                    onChange={(e) =>
                      setFormData({ ...formData, tenant_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_name">Propriété *</Label>
                  <Input
                    id="property_name"
                    placeholder="Appartement T3"
                    value={formData.property_name}
                    onChange={(e) =>
                      setFormData({ ...formData, property_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Date d'expiration</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fichier du contrat * (PDF ou Word, max 10MB)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    required
                    className="cursor-pointer"
                  />
                </div>
                {formData.file && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {formData.file.name} ({formatFileSize(formData.file.size)})
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="gradient" disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contrat..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contracts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun contrat
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Aucun contrat ne correspond à votre recherche"
              : "Commencez par ajouter votre premier contrat"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map((contract, index) => {
            const FileIcon = getFileIcon(contract.file_type);
            const isExpired =
              contract.expires_at &&
              new Date(contract.expires_at) < new Date();

            return (
              <div
                key={contract.id}
                className="rounded-xl border bg-card p-6 shadow-soft hover:shadow-glow transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {contract.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(contract.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {contract.tenant_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {contract.property_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(contract.created_at), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {contract.expires_at && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isExpired ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {isExpired ? "Expiré" : "Expire le"}{" "}
                        {format(new Date(contract.expires_at), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(contract)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(contract)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

