# Guide d'Installation SQL pour ImmoGest

## 🚀 Installation Rapide

### Option 1 : Installation Complète (Recommandé pour nouveau projet)

1. **Ouvrez votre projet Supabase**
2. **Allez dans SQL Editor**
3. **Cliquez sur "New Query"**
4. **Copiez tout le contenu de `supabase-schema.sql`**
5. **Collez dans l'éditeur SQL**
6. **Cliquez sur "Run" (ou F5)**

✅ **C'est tout !** Le script va automatiquement :
- Créer toutes les tables
- Configurer les triggers
- Activer la sécurité RLS
- Créer le bucket de stockage (si possible)
- Configurer toutes les politiques

### Option 2 : Migration (Si vous avez déjà une base existante)

Si vous avez déjà exécuté une version précédente du script :

1. **Exécutez d'abord `supabase-migration.sql`**
   - Cela mettra à jour les utilisateurs existants
   - Synchronisera les profils avec auth.users

2. **Puis exécutez `supabase-schema.sql`**
   - Le script est idempotent : il peut être exécuté plusieurs fois sans erreur
   - Il mettra à jour ce qui existe et créera ce qui manque

## ✨ Fonctionnalités Automatiques

### 1. Création Automatique de Profil
Quand un utilisateur s'inscrit :
- ✅ Un profil est automatiquement créé dans la table `profiles`
- ✅ Le nom complet est récupéré depuis les métadonnées
- ✅ L'email est synchronisé

### 2. Mise à Jour Automatique
- ✅ `updated_at` est mis à jour automatiquement sur toutes les tables
- ✅ Pas besoin de le gérer manuellement dans votre code

### 3. Sécurité Automatique
- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Les utilisateurs ne voient que leurs propres données
- ✅ Les fichiers sont protégés par dossier utilisateur

### 4. Bucket de Stockage
- ✅ Le bucket `contracts` est créé automatiquement (si permissions OK)
- ✅ Limite de 10MB par fichier
- ✅ Types MIME autorisés : PDF, DOC, DOCX
- ✅ Politiques de sécurité configurées

## 🔍 Vérifications Après Installation

### Vérifier les Tables

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'contracts');
```

### Vérifier les Triggers

```sql
-- Vérifier les triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';
```

### Vérifier le Bucket

```sql
-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'contracts';
```

Si le bucket n'existe pas, créez-le manuellement :
1. Allez dans **Storage > Buckets**
2. Cliquez sur **"New bucket"**
3. Nom : `contracts`
4. Public : **Non**
5. File size limit : `10485760` (10 MB)
6. Allowed MIME types : `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Vérifier les Politiques RLS

```sql
-- Vérifier les politiques pour profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Vérifier les politiques pour contracts
SELECT * FROM pg_policies WHERE tablename = 'contracts';
```

## 🐛 Dépannage

### Erreur : "permission denied for schema public"
**Solution :** Exécutez le script en tant qu'administrateur ou vérifiez vos permissions Supabase.

### Erreur : "bucket already exists"
**Solution :** C'est normal ! Le script gère cela automatiquement avec `ON CONFLICT DO NOTHING`.

### Erreur : "policy already exists"
**Solution :** Le script supprime automatiquement les anciennes politiques avant de les recréer. Si l'erreur persiste, supprimez-les manuellement :

```sql
DROP POLICY IF EXISTS "nom_de_la_politique" ON nom_table;
```

### Le bucket n'est pas créé automatiquement
**Solution :** Créez-le manuellement dans l'interface Supabase Storage (voir section "Vérifier le Bucket" ci-dessus).

## 📊 Structure de la Base de Données

### Table `profiles`
```sql
- id (UUID, PK, FK → auth.users)
- email (TEXT, NOT NULL)
- full_name (TEXT, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Table `contracts`
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- title (TEXT, NOT NULL)
- tenant_name (TEXT, NOT NULL)
- property_name (TEXT, NOT NULL)
- file_path (TEXT, NOT NULL)
- file_url (TEXT, NOT NULL)
- file_type (TEXT, NOT NULL)
- file_size (BIGINT, NOT NULL)
- file_name (TEXT, NOT NULL)
- expires_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔄 Réexécution du Script

Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème. Il :
- ✅ Ne recrée pas ce qui existe déjà
- ✅ Met à jour ce qui a changé
- ✅ Crée ce qui manque
- ✅ Supprime et recrée les politiques (pour les mettre à jour)

## 📝 Notes Importantes

1. **Sauvegardez votre base** avant d'exécuter le script sur une base de production
2. **Testez d'abord** sur un projet de développement
3. **Vérifiez les logs** après l'exécution pour voir les avertissements
4. **Le bucket peut nécessiter** une création manuelle selon vos permissions

## 🎯 Prochaines Étapes

Après avoir exécuté le script :

1. ✅ Configurez les variables d'environnement (`.env`)
2. ✅ Testez l'inscription d'un utilisateur
3. ✅ Vérifiez que le profil est créé automatiquement
4. ✅ Testez l'upload d'un contrat
5. ✅ Vérifiez que les fichiers sont bien stockés

---

**Besoin d'aide ?** Consultez `SUPABASE_SETUP.md` pour plus de détails.

