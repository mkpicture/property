-- ============================================================================
-- SCHÉMA SQL POUR LES PROPRIÉTÉS, LOCATAIRES ET PAIEMENTS - SUPABASE
-- ============================================================================
-- Ce script étend le schéma existant avec les tables pour la gestion immobilière
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Table des propriétés immobilières
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Appartement, Maison, Studio, etc.
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('loué', 'vacant')),
  monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  surface_area NUMERIC(8, 2), -- en m²
  rooms INTEGER,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table des locataires
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_number TEXT, -- Numéro de pièce d'identité
  address TEXT,
  move_in_date DATE,
  move_out_date DATE,
  monthly_rent NUMERIC(12, 2) NOT NULL,
  payment_day INTEGER DEFAULT 1 CHECK (payment_day >= 1 AND payment_day <= 31), -- Jour du mois pour le paiement
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'en attente' CHECK (status IN ('payé', 'en attente', 'en retard')),
  payment_method TEXT, -- Virement, Mobile Money, Espèces, etc.
  reference TEXT, -- Référence de paiement
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table pour les notifications de paiement
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  notification_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON public.payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id ON public.payment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_tenant_id ON public.payment_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_notification_date ON public.payment_notifications(notification_date);

-- ============================================================================
-- 3. FONCTIONS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_properties_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour mettre à jour updated_at sur tenants
CREATE OR REPLACE FUNCTION public.update_tenants_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour mettre à jour updated_at sur payments
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour créer automatiquement les paiements mensuels
CREATE OR REPLACE FUNCTION public.create_monthly_payments()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_due_date DATE;
  current_year INTEGER;
  current_month INTEGER;
BEGIN
  -- Si le locataire a un jour de paiement défini
  IF NEW.payment_day IS NOT NULL AND NEW.move_in_date IS NOT NULL THEN
    -- Calculer la prochaine date d'échéance
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Si le jour de paiement est passé ce mois, passer au mois suivant
    IF NEW.payment_day < EXTRACT(DAY FROM CURRENT_DATE) THEN
      current_month := current_month + 1;
      IF current_month > 12 THEN
        current_month := 1;
        current_year := current_year + 1;
      END IF;
    END IF;
    
    -- Construire la date d'échéance
    next_due_date := MAKE_DATE(current_year, current_month, NEW.payment_day);
    
    -- Créer le paiement si il n'existe pas déjà
    INSERT INTO public.payments (user_id, tenant_id, property_id, amount, due_date, status)
    VALUES (NEW.user_id, NEW.id, NEW.property_id, NEW.monthly_rent, next_due_date, 'en attente')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS update_properties_updated_at_trigger ON public.properties;
DROP TRIGGER IF EXISTS update_tenants_updated_at_trigger ON public.tenants;
DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON public.payments;
DROP TRIGGER IF EXISTS create_monthly_payments_trigger ON public.tenants;

-- Trigger pour mettre à jour updated_at sur properties
CREATE TRIGGER update_properties_updated_at_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_properties_updated_at();

-- Trigger pour mettre à jour updated_at sur tenants
CREATE TRIGGER update_tenants_updated_at_trigger
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenants_updated_at();

-- Trigger pour mettre à jour updated_at sur payments
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payments_updated_at();

-- Trigger pour créer automatiquement les paiements mensuels (optionnel, peut être désactivé)
-- CREATE TRIGGER create_monthly_payments_trigger
--   AFTER INSERT ON public.tenants
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_monthly_payments();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur les tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  -- Supprimer les politiques existantes pour properties
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres propriétés" ON public.properties;
  
  -- Supprimer les politiques existantes pour tenants
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres locataires" ON public.tenants;
  
  -- Supprimer les politiques existantes pour payments
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres paiements" ON public.payments;
  
  -- Supprimer les politiques existantes pour payment_notifications
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres notifications" ON public.payment_notifications;
END $$;

-- Politiques RLS pour properties
CREATE POLICY "Les utilisateurs peuvent voir leurs propres propriétés"
  ON public.properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres propriétés"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres propriétés"
  ON public.properties FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres propriétés"
  ON public.properties FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour tenants
CREATE POLICY "Les utilisateurs peuvent voir leurs propres locataires"
  ON public.tenants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres locataires"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres locataires"
  ON public.tenants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres locataires"
  ON public.tenants FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour payments
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres paiements"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres paiements"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres paiements"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour payment_notifications
CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications"
  ON public.payment_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres notifications"
  ON public.payment_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres notifications"
  ON public.payment_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. GRANTS (Permissions)
-- ============================================================================

-- Donner les permissions nécessaires aux utilisateurs authentifiés
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payment_notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

