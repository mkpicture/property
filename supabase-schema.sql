-- ============================================================================
-- SCHÉMA SQL POUR IMMOGEST - SUPABASE
-- ============================================================================
-- Ce script configure automatiquement toute la base de données pour ImmoGest
-- Il est idempotent : peut être exécuté plusieurs fois sans erreur
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table des contrats
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
-- 2. INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON public.contracts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- 3. FONCTIONS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
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

-- Fonction pour créer automatiquement un profil lors de l'inscription
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

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Supprimer les triggers existants s'ils existent (pour éviter les doublons)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger pour mettre à jour updated_at sur profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur contracts
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour créer le profil automatiquement lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  -- Supprimer les politiques existantes pour profiles
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre profil" ON public.profiles;
  
  -- Supprimer les politiques existantes pour contracts
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
-- 6. STORAGE BUCKET (si les permissions le permettent)
-- ============================================================================

-- Essayer de créer le bucket de stockage automatiquement
-- Note: Cela peut échouer si vous n'avez pas les permissions nécessaires
-- Dans ce cas, créez-le manuellement dans l'interface Supabase Storage
DO $$
BEGIN
  -- Vérifier si le bucket existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'contracts'
  ) THEN
    -- Créer le bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'contracts',
      'contracts',
      false,
      10485760, -- 10 MB en bytes
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
    RAISE NOTICE 'Impossible de créer le bucket automatiquement. Créez-le manuellement dans Storage > Buckets avec le nom "contracts"';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création du bucket: %', SQLERRM;
END $$;

-- ============================================================================
-- 7. POLITIQUES DE STOCKAGE
-- ============================================================================

-- Supprimer les anciennes politiques de stockage si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres fichiers" ON storage.objects;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres fichiers" ON storage.objects;
END $$;

-- Politiques de stockage pour le bucket contracts
-- Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent uploader leurs propres fichiers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les utilisateurs peuvent voir leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent voir leurs propres fichiers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Les utilisateurs peuvent mettre à jour leurs propres fichiers
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

-- Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres fichiers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contracts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 8. GRANTS (Permissions)
-- ============================================================================

-- Donner les permissions nécessaires aux utilisateurs authentifiés
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.contracts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Vérifications à faire après l'exécution :
-- 1. Vérifiez que les tables existent : SELECT * FROM public.profiles LIMIT 1;
-- 2. Vérifiez que le bucket existe : SELECT * FROM storage.buckets WHERE id = 'contracts';
-- 3. Testez l'inscription d'un utilisateur pour vérifier le trigger
-- ============================================================================
