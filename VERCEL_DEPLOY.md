# Guide de Déploiement Vercel

## Configuration des Variables d'Environnement

Pour que l'application fonctionne correctement sur Vercel, vous devez configurer les variables d'environnement suivantes :

### Étapes :

1. **Allez dans votre projet Vercel**
   - Ouvrez votre projet sur [vercel.com](https://vercel.com)
   - Cliquez sur **Settings** → **Environment Variables**

2. **Ajoutez les variables suivantes :**

   | Variable | Valeur | Environnement |
   |----------|--------|---------------|
   | `VITE_SUPABASE_URL` | `https://vufrsgvhkeinifqmouei.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

3. **Sélectionnez tous les environnements** (Production, Preview, Development)

4. **Cliquez sur "Save"**

5. **Redéployez votre application**
   - Allez dans **Deployments**
   - Cliquez sur les trois points (⋯) du dernier déploiement
   - Sélectionnez **Redeploy**

## Vérification du Déploiement

Après le déploiement, vérifiez que :

1. ✅ Le build se termine sans erreur
2. ✅ L'application s'affiche sur l'URL fournie par Vercel
3. ✅ La page d'accueil (`/`) s'affiche correctement
4. ✅ La page d'authentification (`/auth`) fonctionne
5. ✅ Les routes protégées redirigent vers `/auth` si non connecté

## Problèmes Courants

### L'application affiche une page blanche

**Solution :**
- Vérifiez que les variables d'environnement sont bien configurées
- Vérifiez les logs de build dans Vercel
- Assurez-vous que le build se termine avec succès

### Erreur "Failed to fetch" ou erreurs Supabase

**Solution :**
- Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctement configurées
- Vérifiez que votre projet Supabase est actif
- Vérifiez les politiques RLS dans Supabase

### Les routes ne fonctionnent pas (404)

**Solution :**
- Vérifiez que le fichier `vercel.json` est présent avec la configuration `rewrites`
- Le fichier devrait contenir :
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

## Structure du Projet

Le projet utilise :
- **Vite** comme bundler
- **React Router** pour le routing côté client
- **Supabase** pour l'authentification et la base de données

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de build dans Vercel
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que toutes les dépendances sont installées correctement

