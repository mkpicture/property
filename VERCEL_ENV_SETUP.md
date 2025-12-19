# Configuration des Variables d'Environnement sur Vercel

## 🔧 Configuration Rapide pour Vercel

Pour que les formulaires d'inscription et de connexion fonctionnent sur Vercel, vous devez configurer les variables d'environnement.

### Étapes :

1. **Allez sur [vercel.com](https://vercel.com)** et connectez-vous
2. **Sélectionnez votre projet** `property`
3. **Allez dans Settings → Environment Variables**
4. **Ajoutez les variables suivantes :**

#### Variable 1 : `VITE_SUPABASE_URL`
- **Valeur :** `https://vufrsgvhkeinifqmouei.supabase.co`
- **Environnements :** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2 : `VITE_SUPABASE_ANON_KEY`
- **Valeur :** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZnJzZ3Zoa2VpbmlmcW1vdWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjYxNjAsImV4cCI6MjA4MTY0MjE2MH0.FfMGMxxOXrlAildbcMdtpEod9OX_TKj9nkqW6M5srLQ`
- **Environnements :** ✅ Production, ✅ Preview, ✅ Development

5. **Cliquez sur "Save"** pour chaque variable

6. **Redéployez votre application :**
   - Allez dans **Deployments**
   - Cliquez sur les **trois points (⋯)** du dernier déploiement
   - Sélectionnez **"Redeploy"**
   - Ou poussez un nouveau commit vers GitHub

## ✅ Vérification

Après le redéploiement :

1. **Ouvrez votre site Vercel**
2. **Allez sur la page d'authentification** (`/auth`)
3. **Testez l'inscription** avec un nouvel email
4. **Vérifiez la console du navigateur** (F12) :
   - Vous devriez voir : `✅ Supabase client initialisé avec succès`
   - Pas d'erreurs rouges

## 🔍 Dépannage

### Si vous voyez "Failed to fetch" :

1. **Vérifiez que les variables sont bien configurées** dans Vercel
2. **Vérifiez que vous avez redéployé** après avoir ajouté les variables
3. **Vérifiez la configuration Supabase** :
   - Allez dans votre projet Supabase
   - **Authentication → URL Configuration**
   - **Site URL** : Votre URL Vercel (ex: `https://property.vercel.app`)
   - **Redirect URLs** : Ajoutez `https://property.vercel.app/**` et `https://property.vercel.app/auth`

### Si l'inscription fonctionne mais pas la connexion :

1. **Vérifiez que l'email de confirmation n'est pas requis** :
   - Dans Supabase : **Authentication → Settings**
   - Désactivez "Enable email confirmations" si vous voulez une connexion immédiate
   - Ou vérifiez votre boîte email pour confirmer le compte

## 📝 Notes Importantes

- ⚠️ Les variables d'environnement doivent commencer par `VITE_` pour être accessibles dans le navigateur
- ⚠️ Redéployez toujours après avoir modifié les variables d'environnement
- ⚠️ Les variables sont sensibles - ne les partagez jamais publiquement

## 🎯 Prochaines Étapes

Une fois les variables configurées :

1. ✅ Testez l'inscription
2. ✅ Testez la connexion
3. ✅ Vérifiez que vous êtes redirigé vers `/dashboard` après connexion
4. ✅ Testez l'ajout d'un contrat

---

**Besoin d'aide ?** Consultez `TROUBLESHOOTING.md` pour plus de solutions.

