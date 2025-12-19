# Guide d'Installation - Property Pal

## 📋 Ordre d'exécution des scripts SQL

Pour éviter les erreurs, exécutez les scripts dans cet ordre dans l'éditeur SQL de Supabase :

### Étape 1 : Schéma de base (si pas déjà fait)
Exécutez `supabase-schema.sql` pour créer :
- Table `profiles`
- Table `contracts`
- Bucket de stockage

### Étape 2 : Schéma des propriétés
Exécutez `supabase-properties-schema.sql` pour créer :
- Table `properties`
- Table `tenants`
- Table `payments`
- Table `payment_notifications`
- Index et politiques RLS

### Étape 3 : Fonctions de notifications
Exécutez `supabase-email-notifications.sql` pour créer :
- Fonction `check_and_create_payment_notifications()`
- Fonction `mark_notification_sent()`
- Vue `pending_notifications`

## ⚠️ Erreur : "relation does not exist"

Si vous obtenez l'erreur `relation "public.payment_notifications" does not exist` :

1. **Vérifiez que vous avez exécuté `supabase-properties-schema.sql` en premier**
2. **Vérifiez que toutes les tables existent** :
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('properties', 'tenants', 'payments', 'payment_notifications')
   ORDER BY table_name;
   ```

3. **Si une table manque, exécutez ce script de réparation** :
   ```sql
   -- Vérifier et créer payment_notifications si manquante
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
   
   CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id 
     ON public.payment_notifications(user_id);
   CREATE INDEX IF NOT EXISTS idx_payment_notifications_tenant_id 
     ON public.payment_notifications(tenant_id);
   CREATE INDEX IF NOT EXISTS idx_payment_notifications_notification_date 
     ON public.payment_notifications(notification_date);
   
   ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
   ```

## 🔧 Script de réparation rapide

Si vous avez des erreurs, exécutez ce script qui crée toutes les tables manquantes :

```sql
-- Vérifier et créer properties
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

-- Vérifier et créer tenants
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

-- Vérifier et créer payments
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

-- Vérifier et créer payment_notifications
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
```

Ensuite, exécutez `supabase-properties-schema.sql` pour créer les index, triggers et politiques RLS.

