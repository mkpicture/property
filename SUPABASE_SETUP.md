# Configuration Supabase - Guide de Démarrage

## 🚀 Configuration en une seule étape

Pour configurer l'ensemble de votre base de données Supabase, vous n'avez besoin d'exécuter qu'un seul script unifié :

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet.
3. Allez dans **SQL Editor** (menu latéral gauche).
4. Cliquez sur **New Query**.
5. Copiez et collez l'intégralité du fichier `supabase-setup-complete.sql`.
6. Cliquez sur **Run** (ou faites Ctrl + Enter).

✅ **Félicitations !** Le script configurera automatiquement :
- **Toutes les tables nécessaires** : `profiles`, `properties`, `tenants`, `payments`, `payment_notifications`, `expenses`, `contracts`.
- Les index de performance pour accélérer les requêtes.
- La fonction et le trigger `on_auth_user_created` pour créer automatiquement le profil d'un utilisateur dans la table `profiles` lors de son inscription.
- La sécurité **Row Level Security (RLS)** sur chaque table pour s'assurer que les utilisateurs ne puissent lire ou écrire que leurs propres données.
- Le bucket de stockage privé `contracts` pour vos contrats de location avec ses règles de sécurité RLS.
- Les fonctions automatiques de relances de paiement et la vue associée.

---

## 📋 Vérification

Après avoir exécuté le script SQL, vous pouvez exécuter cette requête de test dans l'éditeur SQL pour valider la création de toutes les tables :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'properties', 'tenants', 'payments', 'payment_notifications', 'expenses', 'contracts')
ORDER BY table_name;
```

Vous devriez obtenir **7 lignes** correspondant aux 7 tables.

---

## 🔄 Réinitialiser les données d'un utilisateur

Si vous souhaitez supprimer toutes les données d'un utilisateur pour faire un test propre :
1. Ouvrez `supabase-reset-user-data.sql`
2. Remplacez `'USER_ID_HERE'` par l'ID UUID de l'utilisateur (que vous trouverez dans l'onglet Authentication de Supabase ou via la table `auth.users`).
3. Exécutez le script dans le SQL Editor.

---

## 🔧 Variables d'environnement locales

Pour faire tourner le projet localement avec votre instance Supabase, assurez-vous que votre fichier `.env` à la racine contient les clés suivantes :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique-jwt
```

*Note : Vite exige que les variables destinées au client soient préfixées par `VITE_` pour des raisons de sécurité.*
