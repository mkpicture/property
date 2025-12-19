# Mise à Jour des Variables d'Environnement Vercel

## 🔑 Nouvelles Clés Supabase

Votre projet Supabase utilise maintenant une **clé publishable** au lieu de la clé anon classique.

### Configuration sur Vercel

1. **Allez dans votre projet Vercel** → Settings → Environment Variables

2. **Mettez à jour ou ajoutez ces variables :**

#### Option 1 : Utiliser les noms Vite (recommandé)
- **VITE_SUPABASE_URL** = `https://vufrsgvhkeinifqmouei.supabase.co`
- **VITE_SUPABASE_ANON_KEY** = `sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve`

#### Option 2 : Utiliser les noms Next.js (compatibilité)
- **NEXT_PUBLIC_SUPABASE_URL** = `https://vufrsgvhkeinifqmouei.supabase.co`
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY** = `sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve`

3. **Sélectionnez tous les environnements** (Production, Preview, Development)

4. **Cliquez sur "Save"**

5. **Redéployez** votre application

## ✅ Vérification

Le code utilise maintenant automatiquement :
- Les variables d'environnement si elles sont configurées
- Les valeurs par défaut intégrées si les variables ne sont pas trouvées

**Les connexions fonctionneront dans tous les cas !**

## 📝 Note

La clé `sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve` est déjà intégrée dans le code comme valeur par défaut, donc même sans configurer les variables d'environnement sur Vercel, l'application fonctionnera.

Cependant, il est **recommandé** de configurer les variables d'environnement pour :
- Plus de sécurité
- Faciliter les changements de clés
- Meilleure pratique

