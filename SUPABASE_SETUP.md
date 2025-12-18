# Configuration Supabase

Ce guide vous explique comment configurer Supabase pour l'application ImmoGest.

## Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Remplissez les informations de votre projet :
   - Nom du projet
   - Mot de passe de la base de données
   - Région (choisissez la plus proche de vos utilisateurs)
5. Attendez que le projet soit créé (2-3 minutes)

## Étape 2 : Configurer les variables d'environnement

1. Dans votre projet Supabase, allez dans **Settings > API**
2. Copiez les valeurs suivantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (la clé publique)

3. Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

⚠️ **Important** : Ne commitez jamais le fichier `.env` dans Git. Il est déjà dans `.gitignore`.

## Étape 3 : Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New Query"
3. Copiez et collez le contenu du fichier `supabase-schema.sql`
4. Cliquez sur "Run" pour exécuter le script

Ce script va créer :
- La table `profiles` pour les profils utilisateurs
- La table `contracts` pour les contrats
- Les politiques de sécurité (RLS)
- Les triggers pour la mise à jour automatique

## Étape 4 : Créer le bucket de stockage

1. Dans votre projet Supabase, allez dans **Storage**
2. Cliquez sur "Create a new bucket"
3. Configurez le bucket :
   - **Name** : `contracts`
   - **Public bucket** : Désactivé (non public)
   - **File size limit** : 10 MB (ou selon vos besoins)
   - **Allowed MIME types** : `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`
4. Cliquez sur "Create bucket"

## Étape 5 : Configurer l'authentification

1. Dans votre projet Supabase, allez dans **Authentication > Settings**
2. Configurez les paramètres suivants :
   - **Site URL** : `http://localhost:8080` (pour le développement)
   - **Redirect URLs** : Ajoutez `http://localhost:8080/auth` et votre URL de production

3. (Optionnel) Configurez l'email :
   - Allez dans **Authentication > Email Templates**
   - Personnalisez les templates d'email si nécessaire

## Étape 6 : Tester l'application

1. Démarrez l'application :
   ```bash
   npm run dev
   ```

2. Allez sur `http://localhost:8080`
3. Testez l'inscription d'un nouvel utilisateur
4. Vérifiez que vous pouvez vous connecter
5. Testez l'ajout d'un contrat (PDF ou Word)

## Dépannage

### Erreur : "Les variables d'environnement Supabase ne sont pas configurées"
- Vérifiez que le fichier `.env` existe et contient les bonnes valeurs
- Redémarrez le serveur de développement après avoir créé/modifié le fichier `.env`

### Erreur lors de l'upload de fichier
- Vérifiez que le bucket `contracts` existe dans Storage
- Vérifiez que les politiques de stockage sont correctement configurées
- Vérifiez que le fichier ne dépasse pas la taille limite

### Erreur d'authentification
- Vérifiez que les Redirect URLs sont correctement configurées dans Supabase
- Vérifiez que l'email de confirmation n'est pas requis (ou vérifiez votre boîte email)

## Structure de la base de données

### Table `profiles`
- `id` : UUID (référence à auth.users)
- `email` : Email de l'utilisateur
- `full_name` : Nom complet
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Table `contracts`
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence à auth.users)
- `title` : Titre du contrat
- `tenant_name` : Nom du locataire
- `property_name` : Nom de la propriété
- `file_path` : Chemin du fichier dans Storage
- `file_url` : URL publique du fichier
- `file_type` : Type MIME du fichier
- `file_size` : Taille du fichier en bytes
- `file_name` : Nom original du fichier
- `expires_at` : Date d'expiration (optionnel)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## Sécurité

L'application utilise Row Level Security (RLS) pour s'assurer que :
- Les utilisateurs ne peuvent voir que leurs propres contrats
- Les utilisateurs ne peuvent modifier que leurs propres données
- Les fichiers sont stockés de manière sécurisée dans Supabase Storage

