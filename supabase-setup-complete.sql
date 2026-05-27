-- ============================================================================
-- SCRIPT DE CONFIGURATION SUPABASE UNIFIÉ ET COMPLET
-- ============================================================================
-- Ce script configure automatiquement TOUTE la base de données pour ImmoGest.
-- Il crée les 7 tables nécessaires, leurs index, RLS, triggers et stockage.
-- Il est IDEMPOTENT : peut être exécuté plusieurs fois sans erreur.
-- Exécutez ce script dans l'éditeur SQL (SQL Editor) de votre projet Supabase.
-- ============================================================================

-- ============================================================================
-- 1. CRÉATION DES TABLES
-- ============================================================================

-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

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

-- Table des dépenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'maintenance',
    'réparation',
    'amélioration',
    'taxes',
    'assurance',
    'utilitaires',
    'gestion',
    'marketing',
    'juridique',
    'autre'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table des contrats (documents)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  property_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CRÉATION DES INDEX DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
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
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON public.contracts(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 3. CRÉATION DES FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction générique pour mettre à jour la colonne updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attacher le trigger de mise à jour à toutes les tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at_trigger ON public.properties;
CREATE TRIGGER update_properties_updated_at_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at_trigger ON public.tenants;
CREATE TRIGGER update_tenants_updated_at_trigger
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON public.payments;
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer automatiquement le profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Utilisateur')
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attacher le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

-- Fonction de marquage de l'envoi d'email
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
-- 4. CONFIGURATION DE LA SECURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer la RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les doublons
DO $$ 
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre profil" ON public.profiles;
  
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
  
  -- Expenses
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres dépenses" ON public.expenses;

  -- Contracts
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres contrats" ON public.contracts;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres contrats" ON public.contracts;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres contrats" ON public.contracts;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres contrats" ON public.contracts;
END $$;

-- Politiques RLS pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Politiques RLS pour expenses
CREATE POLICY "Les utilisateurs peuvent voir leurs propres dépenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres dépenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres dépenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres dépenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour contracts
CREATE POLICY "Les utilisateurs peuvent voir leurs propres contrats"
  ON public.contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres contrats"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres contrats"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres contrats"
  ON public.contracts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CRÉATION DU STORAGE BUCKET (SI NON EXISTANT)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'contracts'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'contracts',
      'contracts',
      false,
      10485760, -- 10 MB
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Privilèges insuffisants pour créer le bucket storage. Créez-le manuellement si besoin.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création du bucket storage: %', SQLERRM;
END $$;

-- Politiques de stockage RLS
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres fichiers" ON storage.objects;
END $$;

CREATE POLICY "Les utilisateurs peuvent uploader leurs propres fichiers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Les utilisateurs peuvent voir leurs propres fichiers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres fichiers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres fichiers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 6. AUTORISATIONS DES UTILISATEURS AUTHENTIFIÉS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payment_notifications TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT ALL ON public.contracts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
