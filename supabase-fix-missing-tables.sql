-- ============================================================================
-- SCRIPT DE RÉPARATION - Créer les tables manquantes
-- ============================================================================
-- Exécutez ce script si vous obtenez l'erreur "relation does not exist"
-- Ce script crée toutes les tables dans le bon ordre
-- ============================================================================

-- 1. Créer la table properties (si elle n'existe pas)
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

-- 2. Créer la table tenants (dépend de properties)
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

-- 3. Créer la table payments (dépend de tenants et properties)
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

-- 4. Créer la table payment_notifications (dépend de tenants et payments)
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

-- 5. Créer les index
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

-- 6. Activer RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- 7. Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  -- Properties
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres propriétés" ON public.properties;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres propriétés" ON public.properties;
  
  -- Tenants
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres locataires" ON public.tenants;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres locataires" ON public.tenants;
  
  -- Payments
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON public.payments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres paiements" ON public.payments;
  
  -- Payment notifications
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres notifications" ON public.payment_notifications;
END $$;

-- 8. Créer les politiques RLS
-- Properties
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

-- Tenants
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

-- Payments
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

-- Payment notifications
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

-- 9. Grants
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payment_notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Après l'exécution, toutes les tables devraient être créées
-- Vous pouvez maintenant exécuter supabase-email-notifications.sql
-- ============================================================================

