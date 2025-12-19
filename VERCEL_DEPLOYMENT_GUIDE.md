# Guide de Déploiement et Modification sur Vercel

Ce guide explique comment modifier et déployer l'application sur Vercel.

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Modifier les variables d'environnement](#modifier-les-variables-denvironnement)
3. [Déployer depuis GitHub](#déployer-depuis-github)
4. [Réinitialiser les données pour un nouvel utilisateur](#réinitialiser-les-données-pour-un-nouvel-utilisateur)
5. [Vérifier que tout fonctionne](#vérifier-que-tout-fonctionne)

## 🚀 Configuration initiale

### Étape 1 : Connecter votre projet GitHub à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **Add New Project**
3. Importez votre repository GitHub
4. Vercel détectera automatiquement les paramètres (Vite/React)

### Étape 2 : Configurer les variables d'environnement

1. Dans votre projet Vercel, allez dans **Settings > Environment Variables**
2. Ajoutez les variables suivantes :

```
VITE_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
```

Ou avec le préfixe `NEXT_PUBLIC_` pour compatibilité :

```
NEXT_PUBLIC_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
```

3. Sélectionnez les environnements : **Production**, **Preview**, **Development**
4. Cliquez sur **Save**

## 🔧 Modifier les variables d'environnement

### Méthode 1 : Via l'interface Vercel (Recommandé)

1. Allez sur votre projet Vercel
2. Cliquez sur **Settings**
3. Cliquez sur **Environment Variables**
4. Modifiez ou ajoutez les variables nécessaires
5. Cliquez sur **Save**
6. **Important** : Redéployez votre application pour que les changements prennent effet
   - Allez dans **Deployments**
   - Cliquez sur les trois points (⋯) du dernier déploiement
   - Cliquez sur **Redeploy**

### Méthode 2 : Via le CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Ajouter une variable d'environnement
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

## 📦 Déployer depuis GitHub

### Déploiement automatique

Vercel déploie automatiquement à chaque push sur la branche `main` :

1. Faites vos modifications localement
2. Committez et poussez vers GitHub :
   ```bash
   git add .
   git commit -m "Vos modifications"
   git push origin main
   ```
3. Vercel détectera automatiquement le push et lancera un nouveau déploiement
4. Vous pouvez suivre le déploiement dans l'onglet **Deployments** de Vercel

### Déploiement manuel

1. Allez dans **Deployments**
2. Cliquez sur **Create Deployment**
3. Sélectionnez la branche et le commit
4. Cliquez sur **Deploy**

## 🔄 Réinitialiser les données pour un nouvel utilisateur

### Option 1 : Via Supabase SQL Editor (Recommandé)

1. Allez sur votre projet Supabase
2. Ouvrez **SQL Editor**
3. Exécutez le script `supabase-reset-user-data.sql`
4. **Important** : Remplacez `'USER_ID_HERE'` par l'ID réel de l'utilisateur

Pour trouver l'ID d'un utilisateur :
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

### Option 2 : Supprimer toutes les données (Test uniquement)

⚠️ **Attention** : Ceci supprimera TOUTES les données de TOUS les utilisateurs

1. Exécutez `supabase-reset-data.sql` dans Supabase SQL Editor

## ✅ Vérifier que tout fonctionne

### 1. Vérifier les variables d'environnement

Dans Vercel, allez dans **Settings > Environment Variables** et vérifiez que :
- `VITE_SUPABASE_URL` est défini
- `VITE_SUPABASE_ANON_KEY` est défini

### 2. Vérifier le déploiement

1. Allez dans **Deployments**
2. Vérifiez que le dernier déploiement est **Ready** (vert)
3. Cliquez sur le déploiement pour voir les logs

### 3. Tester l'application

1. Ouvrez votre site déployé
2. Testez l'inscription d'un nouvel utilisateur
3. Vérifiez que les données sont sauvegardées dans Supabase
4. Vérifiez que les montants s'affichent en FCFA

### 4. Vérifier les logs

Si quelque chose ne fonctionne pas :
1. Allez dans **Deployments**
2. Cliquez sur le déploiement
3. Consultez les **Build Logs** et **Function Logs**

## 🔍 Dépannage

### L'application ne se charge pas

1. Vérifiez les **Build Logs** dans Vercel
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que le build passe localement : `npm run build`

### Les données ne se sauvegardent pas

1. Vérifiez que les variables d'environnement Supabase sont correctes
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez les logs Supabase dans le dashboard

### Les montants ne s'affichent pas en FCFA

1. Vérifiez que le code utilise `formatFCFA()` de `@/lib/currency`
2. Vérifiez que le build inclut les modifications
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Erreur "Failed to fetch"

1. Vérifiez que l'URL Supabase est correcte
2. Vérifiez que la clé API est correcte
3. Vérifiez les paramètres CORS dans Supabase
4. Vérifiez que les tables existent dans Supabase

## 📝 Notes importantes

- **Redéployez toujours après avoir modifié les variables d'environnement**
- Les variables d'environnement sont disponibles au moment du build
- Pour les changements de code, un simple push déclenche un nouveau déploiement
- Les données sont stockées dans Supabase, pas dans Vercel
- Les montants sont en FCFA dans toute l'application

## 🚀 Commandes utiles

```bash
# Build local pour tester
npm run build

# Tester le build localement
npm run preview

# Voir les variables d'environnement Vercel
vercel env ls

# Déployer en preview
vercel

# Déployer en production
vercel --prod
```

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs Vercel
2. Consultez les logs Supabase
3. Vérifiez la console du navigateur
4. Vérifiez que toutes les tables existent dans Supabase

