-- ============================================================================
-- SCRIPT DE MIGRATION POUR MISE À JOUR
-- ============================================================================
-- Utilisez ce script si vous avez déjà exécuté supabase-schema.sql
-- et que vous voulez mettre à jour sans recréer tout
-- ============================================================================

-- Mettre à jour les utilisateurs existants qui n'ont pas de profil
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'Utilisateur')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les profils existants avec les données de auth.users
UPDATE public.profiles p
SET 
  email = COALESCE(u.email, p.email),
  full_name = COALESCE(
    u.raw_user_meta_data->>'full_name',
    p.full_name,
    u.email,
    'Utilisateur'
  ),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (
    p.email IS DISTINCT FROM u.email
    OR p.full_name IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'full_name', u.email)
  );

