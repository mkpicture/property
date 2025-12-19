-- ============================================================================
-- SCRIPT DE RÉINITIALISATION DES DONNÉES - SUPABASE
-- ============================================================================
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données des tables
-- Utilisez-le uniquement si vous voulez remettre la base à zéro
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

-- Désactiver temporairement RLS pour permettre la suppression
ALTER TABLE public.payment_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les données (dans l'ordre des dépendances)
DELETE FROM public.payment_notifications;
DELETE FROM public.payments;
DELETE FROM public.tenants;
DELETE FROM public.properties;
DELETE FROM public.contracts;

-- Note: On ne supprime PAS les profils utilisateurs (profiles) ni les utilisateurs (auth.users)
-- car cela supprimerait les comptes utilisateurs

-- Réactiver RLS
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Réinitialiser les séquences (si nécessaire)
-- Les UUID sont générés automatiquement, donc pas besoin de réinitialiser

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Après l'exécution, toutes les données seront supprimées sauf les comptes utilisateurs
-- ============================================================================

