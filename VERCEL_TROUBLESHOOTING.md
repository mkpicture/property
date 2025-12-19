# Dépannage Vercel - Rien ne s'affiche

## 🔍 Diagnostic rapide

### 1. Vérifier les logs de build sur Vercel

1. Allez sur votre projet Vercel
2. Cliquez sur **Deployments**
3. Cliquez sur le dernier déploiement
4. Regardez les **Build Logs**

**Erreurs courantes** :
- `Module not found` → Problème d'import
- `Build failed` → Erreur de compilation
- `Command failed` → Problème avec npm install ou build

### 2. Vérifier les logs de runtime

1. Dans le déploiement, regardez les **Function Logs**
2. Vérifiez s'il y a des erreurs JavaScript

### 3. Vérifier la console du navigateur

1. Ouvrez votre site sur Vercel
2. Ouvrez les outils de développement (F12)
3. Regardez l'onglet **Console** pour les erreurs
4. Regardez l'onglet **Network** pour les requêtes qui échouent

## 🔧 Solutions courantes

### Problème 1 : Page blanche

**Causes possibles** :
- Erreur JavaScript qui bloque le rendu
- Variables d'environnement manquantes
- Problème de build

**Solutions** :
1. Vérifier les variables d'environnement sur Vercel :
   ```
   VITE_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
   ```

2. Vérifier que le build passe :
   ```bash
   npm run build
   ```

3. Tester le build localement :
   ```bash
   npm run build
   npm run preview
   ```

### Problème 2 : Erreur 404 sur toutes les routes

**Cause** : Configuration SPA incorrecte

**Solution** : Le fichier `vercel.json` est déjà configuré avec les rewrites. Vérifiez qu'il est bien présent.

### Problème 3 : Erreur "Failed to fetch"

**Cause** : Variables d'environnement manquantes ou incorrectes

**Solution** :
1. Allez dans Vercel > Settings > Environment Variables
2. Vérifiez que ces variables existent :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Important** : Redéployez après avoir modifié les variables

### Problème 4 : Build échoue

**Solutions** :
1. Vérifier que toutes les dépendances sont dans `package.json`
2. Vérifier qu'il n'y a pas d'erreurs TypeScript :
   ```bash
   npm run build
   ```
3. Vérifier les logs de build sur Vercel

## 🚀 Checklist de déploiement

Avant de déployer, vérifiez :

- [ ] Le build passe localement : `npm run build`
- [ ] Le preview fonctionne : `npm run preview`
- [ ] Les variables d'environnement sont définies sur Vercel
- [ ] Le fichier `vercel.json` existe
- [ ] Aucune erreur dans la console du navigateur
- [ ] Les routes fonctionnent (testez `/`, `/auth`, `/dashboard`)

## 📝 Configuration Vercel recommandée

### Variables d'environnement

Dans Vercel > Settings > Environment Variables, ajoutez :

```
VITE_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
```

**Important** : Sélectionnez tous les environnements (Production, Preview, Development)

### Build Settings

Vercel devrait détecter automatiquement :
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Si ce n'est pas le cas, configurez manuellement dans Settings > General.

## 🆘 Si rien ne fonctionne

1. **Créer un nouveau déploiement**
   - Allez dans Deployments
   - Cliquez sur "Redeploy" sur le dernier déploiement

2. **Vérifier les logs complets**
   - Build Logs
   - Function Logs
   - Runtime Logs

3. **Tester localement**
   ```bash
   npm install
   npm run build
   npm run preview
   ```
   Si ça fonctionne localement mais pas sur Vercel, c'est un problème de configuration Vercel.

4. **Vérifier Supabase**
   - Vérifiez que les tables existent
   - Vérifiez que l'URL et la clé sont correctes

5. **Contacter le support**
   - Si le problème persiste, vérifiez les logs Vercel
   - Vérifiez les logs Supabase
   - Vérifiez la console du navigateur

## 🔍 Commandes utiles

```bash
# Build local
npm run build

# Preview local
npm run preview

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint
```

