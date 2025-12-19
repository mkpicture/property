-- ============================================================================
-- SCRIPT COMPLET DE CONFIGURATION SUPABASE - À EXÉCUTER EN PREMIER
-- ============================================================================
-- Ce script configure toute la base de données pour Property Pal
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- Il est idempotent : peut être exécuté plusieurs fois sans erreur
-- ============================================================================

-- ============================================================================
-- 1. CRÉER LES TABLES (si elles n'existent pas)
-- ============================================================================

-- Table des propriétés immobilières
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('loué', 'vacant')),
  monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  surface_area NUMERIC(8, 2),
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
  id_number TEXT,
  address TEXT,
  move_in_date DATE,
  move_out_date DATE,
  monthly_rent NUMERIC(12, 2) NOT NULL,
  payment_day INTEGER DEFAULT 1 CHECK (payment_day >= 1 AND payment_day <= 31),
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
  payment_method TEXT,
  reference TEXT,
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
-- 2. CRÉER LES INDEX
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
-- 3. CRÉER LES FONCTIONS
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

-- Fonction pour créer les notifications de paiement 10 jours avant l'échéance
CREATE OR REPLACE FUNCTION public.check_and_create_payment_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_record RECORD;
  payment_record RECORD;
  notification_date DATE;
  due_date DATE;
BEGIN
  FOR tenant_record IN
    SELECT 
      t.id as tenant_id,
      t.user_id,
      t.property_id,
      t.full_name,
      t.email,
      t.monthly_rent,
      t.payment_day
    FROM public.tenants t
    WHERE t.move_out_date IS NULL
      AND t.payment_day IS NOT NULL
  LOOP
    due_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    due_date := DATE_TRUNC('month', due_date) + (tenant_record.payment_day - 1) * INTERVAL '1 day';
    
    IF due_date < CURRENT_DATE THEN
      due_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
      due_date := DATE_TRUNC('month', due_date) + (tenant_record.payment_day - 1) * INTERVAL '1 day';
    END IF;
    
    notification_date := due_date - INTERVAL '10 days';
    
    IF NOT EXISTS (
      SELECT 1 
      FROM public.payment_notifications 
      WHERE tenant_id = tenant_record.tenant_id
        AND notification_date = notification_date
        AND payment_id IS NULL
    ) AND notification_date <= CURRENT_DATE THEN
      SELECT id INTO payment_record
      FROM public.payments
      WHERE tenant_id = tenant_record.tenant_id
        AND due_date = due_date
        AND status = 'en attente'
      LIMIT 1;
      
      INSERT INTO public.payment_notifications (
        user_id,
        tenant_id,
        payment_id,
        notification_date
      )
      VALUES (
        tenant_record.user_id,
        tenant_record.tenant_id,
        payment_record.id,
        notification_date
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_sent(
  notification_id UUID,
  email_sent BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.payment_notifications
  SET 
    sent_at = NOW(),
    email_sent = email_sent,
    email_error = error_message
  WHERE id = notification_id;
END;
$$;

-- Vue pour les notifications en attente
CREATE OR REPLACE VIEW public.pending_notifications AS
SELECT 
  pn.id,
  pn.user_id,
  pn.tenant_id,
  pn.payment_id,
  pn.notification_date,
  t.full_name as tenant_name,
  t.email as tenant_email,
  t.phone as tenant_phone,
  t.monthly_rent,
  p.amount,
  p.due_date,
  pr.name as property_name,
  pr.address as property_address
FROM public.payment_notifications pn
JOIN public.tenants t ON t.id = pn.tenant_id
LEFT JOIN public.payments p ON p.id = pn.payment_id
LEFT JOIN public.properties pr ON pr.id = t.property_id
WHERE pn.email_sent = false
  AND pn.notification_date <= CURRENT_DATE
  AND (pn.sent_at IS NULL OR pn.sent_at < CURRENT_DATE - INTERVAL '1 day');

-- ============================================================================
-- 4. CRÉER LES TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_properties_updated_at_trigger ON public.properties;
DROP TRIGGER IF EXISTS update_tenants_updated_at_trigger ON public.tenants;
DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON public.payments;

CREATE TRIGGER update_properties_updated_at_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_properties_updated_at();

CREATE TRIGGER update_tenants_updated_at_trigger
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenants_updated_at();

CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payments_updated_at();

-- ============================================================================
-- 5. CONFIGURER ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres propriétés" ON public.properties;
  
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres locataires" ON public.tenants;
  
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres paiements" ON public.payments;
  
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

GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payment_notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Après l'exécution, toutes les tables, fonctions et politiques sont configurées
-- ============================================================================

