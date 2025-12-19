# Configuration Supabase - Guide Rapide

## 🚀 Configuration complète en une seule étape

### Exécuter le script SQL complet

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier `supabase-setup-complete.sql`
6. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

✅ **C'est tout !** Le script crée automatiquement :
- Toutes les tables (properties, tenants, payments, payment_notifications)
- Tous les index pour les performances
- Toutes les fonctions (notifications email, etc.)
- Toutes les politiques de sécurité (RLS)
- Toutes les permissions

## 📋 Vérification

Après l'exécution, vérifiez que tout est créé :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'tenants', 'payments', 'payment_notifications')
ORDER BY table_name;

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_and_create_payment_notifications', 'mark_notification_sent')
ORDER BY routine_name;
```

Vous devriez voir :
- 4 tables
- 2 fonctions

## 🔄 Réinitialiser les données pour un nouvel utilisateur

Si vous voulez réinitialiser les données d'un utilisateur spécifique :

1. Exécutez `supabase-reset-user-data.sql`
2. **Important** : Remplacez `'USER_ID_HERE'` par l'ID réel de l'utilisateur

Pour trouver l'ID :
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

## ⚠️ Notes importantes

- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans erreur
- Il ne supprime pas les données existantes
- Il crée uniquement ce qui n'existe pas déjà
- Les politiques RLS sont recréées à chaque exécution (pour les mises à jour)

## 🆘 Problèmes courants

### Erreur "relation does not exist"
- Exécutez d'abord `supabase-setup-complete.sql`
- Vérifiez que vous êtes dans le bon projet Supabase

### Erreur de permissions
- Vérifiez que vous êtes connecté en tant qu'administrateur du projet
- Vérifiez que RLS est activé sur les tables

### Les données ne s'affichent pas
- Vérifiez que les politiques RLS sont créées
- Vérifiez que vous êtes connecté avec un compte utilisateur valide
