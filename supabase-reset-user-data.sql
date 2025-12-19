-- ============================================================================
-- SCRIPT DE RÉINITIALISATION DES DONNÉES POUR UN NOUVEL UTILISATEUR
-- ============================================================================
-- Ce script supprime toutes les données d'un utilisateur spécifique
-- Remplacez 'USER_ID_HERE' par l'ID de l'utilisateur (UUID)
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

-- ⚠️ ATTENTION : Remplacez 'USER_ID_HERE' par l'ID réel de l'utilisateur
-- Pour trouver l'ID d'un utilisateur :
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;

DO $$
DECLARE
  target_user_id UUID := 'USER_ID_HERE'; -- ⚠️ MODIFIEZ CETTE LIGNE
BEGIN
  -- Vérifier que l'ID utilisateur est valide
  IF target_user_id = 'USER_ID_HERE' THEN
    RAISE EXCEPTION 'Vous devez remplacer USER_ID_HERE par un ID utilisateur valide';
  END IF;

  -- Supprimer les données dans l'ordre des dépendances
  -- 1. Notifications de paiement
  DELETE FROM public.payment_notifications WHERE user_id = target_user_id;
  RAISE NOTICE 'Notifications de paiement supprimées';

  -- 2. Paiements
  DELETE FROM public.payments WHERE user_id = target_user_id;
  RAISE NOTICE 'Paiements supprimés';

  -- 3. Locataires
  DELETE FROM public.tenants WHERE user_id = target_user_id;
  RAISE NOTICE 'Locataires supprimés';

  -- 4. Propriétés
  DELETE FROM public.properties WHERE user_id = target_user_id;
  RAISE NOTICE 'Propriétés supprimées';

  -- 5. Contrats
  DELETE FROM public.contracts WHERE user_id = target_user_id;
  RAISE NOTICE 'Contrats supprimés';

  -- Note: On ne supprime PAS le profil utilisateur ni le compte auth.users
  -- car cela supprimerait le compte utilisateur lui-même

  RAISE NOTICE 'Réinitialisation terminée pour l''utilisateur %', target_user_id;
END $$;

-- ============================================================================
-- VERSION ALTERNATIVE : Supprimer toutes les données de TOUS les utilisateurs
-- ============================================================================
-- ⚠️ ATTENTION : Ceci supprimera TOUTES les données de TOUS les utilisateurs
-- Utilisez uniquement pour un environnement de test/développement
-- ============================================================================

/*
-- Désactiver temporairement RLS
ALTER TABLE public.payment_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les données
DELETE FROM public.payment_notifications;
DELETE FROM public.payments;
DELETE FROM public.tenants;
DELETE FROM public.properties;
DELETE FROM public.contracts;

-- Réactiver RLS
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

