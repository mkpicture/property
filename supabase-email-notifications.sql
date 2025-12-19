-- ============================================================================
-- FONCTION POUR LES NOTIFICATIONS EMAIL 10 JOURS AVANT PAIEMENT - SUPABASE
-- ============================================================================
-- Ce script crée une fonction qui vérifie les paiements à venir
-- et crée des notifications pour les locataires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================================

-- Créer la table payment_notifications si elle n'existe pas
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

-- Créer l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id ON public.payment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_tenant_id ON public.payment_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_notification_date ON public.payment_notifications(notification_date);

-- Activer RLS si nécessaire
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres notifications" ON public.payment_notifications;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres notifications" ON public.payment_notifications;
END $$;

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

-- Grants
GRANT ALL ON public.payment_notifications TO authenticated;

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
  -- Parcourir tous les locataires actifs (sans date de sortie)
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
    -- Calculer la prochaine date d'échéance
    due_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    due_date := DATE_TRUNC('month', due_date) + (tenant_record.payment_day - 1) * INTERVAL '1 day';
    
    -- Si le jour de paiement est passé ce mois, prendre le mois suivant
    IF due_date < CURRENT_DATE THEN
      due_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
      due_date := DATE_TRUNC('month', due_date) + (tenant_record.payment_day - 1) * INTERVAL '1 day';
    END IF;
    
    -- Date de notification = 10 jours avant l'échéance
    notification_date := due_date - INTERVAL '10 days';
    
    -- Vérifier si une notification existe déjà pour cette date
    IF NOT EXISTS (
      SELECT 1 
      FROM public.payment_notifications 
      WHERE tenant_id = tenant_record.tenant_id
        AND notification_date = notification_date
        AND payment_id IS NULL
    ) AND notification_date <= CURRENT_DATE THEN
      -- Créer ou récupérer le paiement correspondant
      SELECT id INTO payment_record
      FROM public.payments
      WHERE tenant_id = tenant_record.tenant_id
        AND due_date = due_date
        AND status = 'en attente'
      LIMIT 1;
      
      -- Créer la notification
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

-- Fonction pour envoyer les emails (à appeler depuis une Edge Function ou un cron job)
-- Cette fonction marque les notifications comme envoyées
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

-- Vue pour faciliter les requêtes de notifications à envoyer
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
-- CRON JOB (Optionnel - nécessite pg_cron extension)
-- ============================================================================
-- Si vous avez l'extension pg_cron activée, vous pouvez créer un job automatique :
-- 
-- SELECT cron.schedule(
--   'check-payment-notifications',
--   '0 9 * * *', -- Tous les jours à 9h
--   $$SELECT public.check_and_create_payment_notifications();$$
-- );
--
-- Pour désactiver le job :
-- SELECT cron.unschedule('check-payment-notifications');
-- ============================================================================

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Pour utiliser cette fonction :
-- 1. Appelez check_and_create_payment_notifications() quotidiennement (via cron ou Edge Function)
-- 2. Interrogez la vue pending_notifications pour obtenir les emails à envoyer
-- 3. Envoyez les emails via une Edge Function Supabase ou un service externe
-- 4. Marquez les notifications comme envoyées avec mark_notification_sent()
-- ============================================================================

