-- ============================================================================
-- SCHÉMA SQL POUR LES DÉPENSES - SUPABASE
-- ============================================================================
-- Ce script crée la table des dépenses pour ImmoGest
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

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

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres dépenses" ON public.expenses;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres dépenses" ON public.expenses;
END $$;

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

-- Grants
GRANT ALL ON public.expenses TO authenticated;

