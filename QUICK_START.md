# Guide de Démarrage Rapide - Property Pal

## 🚀 Pour un nouvel utilisateur

### 1. Réinitialiser les données dans Supabase

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

### 2. Vérifier les variables d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings > Environment Variables**
4. Vérifiez que ces variables existent :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Si elles n'existent pas, ajoutez-les :
   ```
   VITE_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_La-A2g5jGsUWXQrQiqlXGw_aVGdK8Ve
   ```
6. **Redéployez** l'application après avoir modifié les variables

### 3. Vérifier que tout fonctionne

1. Ouvrez votre site déployé sur Vercel
2. Créez un compte ou connectez-vous
3. Vérifiez que :
   - Les montants s'affichent en **FCFA**
   - Vous pouvez ajouter des biens
   - Vous pouvez ajouter des locataires
   - Les données sont sauvegardées

## 💰 Vérification des devises en FCFA

Tous les montants doivent s'afficher en FCFA. Vérifiez :

- ✅ Dashboard : Revenus mensuels, Loyers impayés
- ✅ Propriétés : Loyer mensuel
- ✅ Locataires : Loyer mensuel
- ✅ Paiements : Montants des paiements
- ✅ Graphiques : Axes et tooltips

Format attendu : `1 500 000 FCFA` (avec espaces pour les milliers)

## 🔄 Réinitialisation complète (tous les utilisateurs)

⚠️ **Attention** : Ceci supprimera TOUTES les données de TOUS les utilisateurs

1. Exécutez `supabase-reset-data.sql` dans Supabase SQL Editor

## 📝 Notes importantes

- Les devises sont en **FCFA** dans toute l'application
- Les données sont stockées dans **Supabase**
- L'application est déployée sur **Vercel**
- Après modification des variables d'environnement, **redéployez toujours**

## 🆘 Problèmes courants

### Les montants ne s'affichent pas en FCFA

1. Videz le cache du navigateur (Ctrl+Shift+R)
2. Vérifiez que le build est à jour sur Vercel
3. Vérifiez que `formatFCFA()` est utilisé partout

### Les données ne se sauvegardent pas

1. Vérifiez les variables d'environnement sur Vercel
2. Vérifiez que les tables existent dans Supabase
3. Vérifiez la console du navigateur pour les erreurs

### Erreur "Failed to fetch"

1. Vérifiez que l'URL Supabase est correcte
2. Vérifiez que la clé API est correcte
3. Vérifiez les paramètres CORS dans Supabase

