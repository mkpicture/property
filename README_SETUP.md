# Guide de Configuration - Property Pal

Ce guide explique comment configurer toutes les fonctionnalités de l'application.

## 📋 Table des matières

1. [Configuration de la base de données](#configuration-de-la-base-de-données)
2. [Réinitialisation des données](#réinitialisation-des-données)
3. [Configuration des notifications email](#configuration-des-notifications-email)
4. [Changement de devise en FCFA](#changement-de-devise-en-fcfa)
5. [Modification des biens](#modification-des-biens)

## 🗄️ Configuration de la base de données

### Étape 1 : Exécuter le schéma principal

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Exécutez le fichier `supabase-schema.sql` (si pas déjà fait)
4. Exécutez le fichier `supabase-properties-schema.sql` pour créer les tables :
   - `properties` (biens immobiliers)
   - `tenants` (locataires)
   - `payments` (paiements)
   - `payment_notifications` (notifications de paiement)

### Étape 2 : Vérifier les tables

Vérifiez que les tables ont été créées :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'tenants', 'payments', 'payment_notifications');
```

## 🔄 Réinitialisation des données

Pour remettre toutes les données à zéro (sauf les comptes utilisateurs) :

1. Allez dans **SQL Editor** de Supabase
2. Exécutez le fichier `supabase-reset-data.sql`

⚠️ **Attention** : Cela supprimera toutes les propriétés, locataires, paiements et contrats, mais conservera les comptes utilisateurs.

## 📧 Configuration des notifications email

### Étape 1 : Créer les fonctions SQL

1. Allez dans **SQL Editor** de Supabase
2. Exécutez le fichier `supabase-email-notifications.sql`

### Étape 2 : Configurer l'envoi d'emails

#### Option A : Utiliser Supabase Email (recommandé)

1. Allez dans **Settings > Auth > SMTP Settings** dans Supabase
2. Configurez votre serveur SMTP (Gmail, SendGrid, etc.)
3. Activez l'envoi d'emails

#### Option B : Utiliser une Edge Function

1. Installez Supabase CLI :
   ```bash
   npm install -g supabase
   ```

2. Connectez-vous :
   ```bash
   supabase login
   ```

3. Liez votre projet :
   ```bash
   supabase link --project-ref votre-project-ref
   ```

4. Déployez la fonction :
   ```bash
   supabase functions deploy send-payment-reminders
   ```

5. Configurez un cron job (pg_cron) ou utilisez un service externe (Vercel Cron, etc.) pour appeler cette fonction quotidiennement

### Étape 3 : Tester les notifications

Pour tester manuellement, exécutez dans SQL Editor :
```sql
-- Créer les notifications
SELECT public.check_and_create_payment_notifications();

-- Voir les notifications en attente
SELECT * FROM public.pending_notifications;
```

## 💰 Changement de devise en FCFA

La devise a été changée en FCFA dans toute l'application. Les montants sont maintenant affichés avec le format :
- `1 500 000 FCFA` au lieu de `1 500€`

Les fichiers modifiés :
- `src/lib/currency.ts` - Utilitaires de formatage
- `src/components/dashboard/PropertyCard.tsx`
- `src/components/dashboard/RevenueChart.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Payments.tsx`

## ✏️ Modification des biens

### Ajouter un bien

1. Allez sur la page **Propriétés**
2. Cliquez sur **Ajouter un bien**
3. Remplissez le formulaire
4. Cliquez sur **Créer**

### Modifier un bien

1. Allez sur la page **Propriétés**
2. Cliquez sur le bouton **Modifier** sur la carte du bien
3. Modifiez les informations
4. Cliquez sur **Modifier**

Les modifications sont sauvegardées dans Supabase et synchronisées en temps réel.

## 🔧 Dépannage

### Les biens ne s'affichent pas

1. Vérifiez que vous êtes connecté
2. Vérifiez que les tables existent dans Supabase
3. Vérifiez la console du navigateur pour les erreurs

### Les notifications ne sont pas envoyées

1. Vérifiez que la fonction `check_and_create_payment_notifications` existe
2. Vérifiez que les locataires ont un email et un `payment_day` défini
3. Vérifiez les logs de la Edge Function dans Supabase
4. Vérifiez la configuration SMTP dans Supabase

### Erreurs de permissions

1. Vérifiez que RLS (Row Level Security) est activé
2. Vérifiez que les politiques RLS sont correctement configurées
3. Vérifiez que vous êtes connecté avec un compte valide

## 📝 Notes importantes

- Les montants sont stockés en nombres dans la base de données (pas de symbole)
- Le formatage FCFA est fait côté client
- Les notifications sont créées 10 jours avant l'échéance
- Les paiements sont créés automatiquement pour les locataires actifs
- Les données sont isolées par utilisateur grâce à RLS

## 🚀 Prochaines étapes

1. Configurez les notifications email
2. Ajoutez vos premiers biens
3. Ajoutez vos locataires
4. Configurez un cron job pour les notifications automatiques
