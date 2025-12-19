# 🚨 Action Immédiate - Rien ne s'affiche sur Vercel

## ⚡ Solution Rapide (5 minutes)

### Étape 1 : Vérifier les variables d'environnement (2 min)

1. Allez sur https://vercel.com
2. Sélectionnez votre projet **property**
3. Allez dans **Settings** (⚙️) > **Environment Variables**
4. Vérifiez que ces 2 variables existent :

```
VITE_SUPABASE_URL = https://vufrsgvhkeinifqmouei.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
```

5. Si elles n'existent pas, **ajoutez-les** :
   - Cliquez sur **Add New**
   - Nom : `VITE_SUPABASE_URL`
   - Valeur : `https://vufrsgvhkeinifqmouei.supabase.co`
   - Sélectionnez : ☑️ Production ☑️ Preview ☑️ Development
   - Cliquez sur **Save**
   - Répétez pour `VITE_SUPABASE_ANON_KEY`

### Étape 2 : Redéployer (1 min)

1. Allez dans **Deployments**
2. Cliquez sur les **trois points (⋯)** du dernier déploiement
3. Cliquez sur **Redeploy**
4. Sélectionnez **Use existing Build Cache** : **Non**
5. Cliquez sur **Redeploy**
6. **Attendez** que le déploiement soit terminé (✅ Ready)

### Étape 3 : Tester (2 min)

1. Cliquez sur le lien du déploiement (ou allez sur votre domaine)
2. Ouvrez les outils de développement (F12)
3. Regardez l'onglet **Console**
4. Si vous voyez des erreurs, notez-les

## 🔍 Diagnostic

### Si vous voyez une page blanche :

1. **Ouvrez la console (F12)**
2. **Regardez les erreurs** :
   - Si vous voyez `Failed to fetch` → Variables d'environnement manquantes
   - Si vous voyez `Cannot read property` → Erreur JavaScript
   - Si vous voyez `404` → Problème de routes

### Si le build échoue sur Vercel :

1. Allez dans **Deployments** > Cliquez sur le déploiement
2. Regardez les **Build Logs**
3. Notez l'erreur exacte

## ✅ Vérifications

Après le redéploiement, vérifiez :

- [ ] Le déploiement est **Ready** (vert)
- [ ] Les variables d'environnement sont définies
- [ ] La page s'affiche (même si c'est une erreur, c'est mieux que blanc)
- [ ] La console ne montre pas d'erreurs critiques

## 🆘 Si ça ne fonctionne toujours pas

### Option 1 : Vérifier les Build Logs

1. Dans le déploiement, regardez **Build Logs**
2. Cherchez les lignes en **rouge**
3. Copiez l'erreur et vérifiez ce guide

### Option 2 : Vérifier la configuration

Dans Vercel > Settings > General, vérifiez :
- Framework Preset: **Vite** (ou Other)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Option 3 : Tester localement

```bash
# Dans le terminal
npm install
npm run build
npm run preview
```

Si ça fonctionne localement mais pas sur Vercel, c'est un problème de configuration Vercel.

## 📞 Informations à fournir si vous avez besoin d'aide

1. **URL de votre site Vercel**
2. **Screenshot de la console (F12)**
3. **Screenshot des Build Logs sur Vercel**
4. **Les variables d'environnement sont-elles définies ?** (Oui/Non)

## 🎯 Solution la plus probable

Dans 90% des cas, le problème est :
- ❌ Variables d'environnement **manquantes** sur Vercel
- ❌ Variables d'environnement **incorrectes** sur Vercel
- ❌ **Pas de redéploiement** après avoir ajouté les variables

**Solution** : Ajoutez les variables → Redéployez → Testez

