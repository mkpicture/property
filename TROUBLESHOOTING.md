# Guide de Dépannage - Erreur "Failed to Fetch"

## 🔴 Erreur : "Failed to fetch" lors de l'inscription

Cette erreur indique que l'application ne peut pas se connecter à Supabase. Voici comment la résoudre :

### ✅ Vérification 1 : Variables d'environnement

**Problème :** Les variables d'environnement Supabase ne sont pas configurées ou sont incorrectes.

**Solution :**

1. **En développement local :**
   - Vérifiez que le fichier `.env` existe à la racine du projet
   - Vérifiez qu'il contient :
     ```env
     VITE_SUPABASE_URL=https://vufrsgvhkeinifqmouei.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_cle_anon_complete
     ```
   - **Redémarrez le serveur de développement** après avoir modifié `.env`
   - Vérifiez la console du navigateur pour voir les messages d'erreur

2. **En production (Vercel/Netlify/etc.) :**
   - Allez dans les **Settings > Environment Variables** de votre plateforme
   - Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies
   - **Redéployez** l'application après avoir ajouté/modifié les variables

### ✅ Vérification 2 : URL Supabase

**Problème :** L'URL Supabase est incorrecte ou le projet n'existe plus.

**Solution :**

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **Settings > API**
4. Copiez l'**URL du projet** (elle doit ressembler à `https://xxxxx.supabase.co`)
5. Vérifiez qu'elle correspond exactement à celle dans vos variables d'environnement
6. Vérifiez qu'il n'y a pas d'espaces ou de caractères supplémentaires

### ✅ Vérification 3 : Clé API

**Problème :** La clé API (anon key) est incorrecte ou expirée.

**Solution :**

1. Dans Supabase, allez dans **Settings > API**
2. Copiez la **anon public key** (la clé publique, pas la service_role key)
3. Vérifiez qu'elle correspond exactement à `VITE_SUPABASE_ANON_KEY`
4. La clé doit commencer par `eyJ...` (c'est un JWT)

### ✅ Vérification 4 : Configuration CORS dans Supabase

**Problème :** Supabase bloque les requêtes depuis votre domaine.

**Solution :**

1. Dans Supabase, allez dans **Authentication > URL Configuration**
2. Vérifiez **Site URL** :
   - En développement : `http://localhost:8080`
   - En production : votre URL de production (ex: `https://votre-app.vercel.app`)
3. Vérifiez **Redirect URLs** et ajoutez :
   - `http://localhost:8080/**` (pour le développement)
   - `https://votre-app.vercel.app/**` (pour la production)
   - `http://localhost:8080/auth` (spécifique)
   - `https://votre-app.vercel.app/auth` (spécifique)
4. Cliquez sur **Save**

### ✅ Vérification 5 : Connexion Internet / Firewall

**Problème :** Votre connexion internet ou un firewall bloque les requêtes.

**Solution :**

1. Vérifiez votre connexion internet
2. Testez si vous pouvez accéder à `https://vufrsgvhkeinifqmouei.supabase.co` dans votre navigateur
3. Vérifiez les paramètres de votre firewall/antivirus
4. Si vous êtes sur un réseau d'entreprise, contactez l'administrateur réseau

### ✅ Vérification 6 : Projet Supabase actif

**Problème :** Le projet Supabase est en pause ou supprimé.

**Solution :**

1. Allez sur [supabase.com](https://supabase.com)
2. Vérifiez que votre projet est **actif** (pas en pause)
3. Si le projet est en pause, réactivez-le
4. Vérifiez que vous avez les permissions nécessaires

### ✅ Vérification 7 : Console du navigateur

**Problème :** Des erreurs plus détaillées peuvent être dans la console.

**Solution :**

1. Ouvrez les **Outils de développement** (F12)
2. Allez dans l'onglet **Console**
3. Regardez les messages d'erreur en rouge
4. Recherchez des messages comme :
   - `❌ Les variables d'environnement Supabase ne sont pas configurées`
   - `Failed to fetch`
   - `CORS policy`
   - `Network error`

### 🔧 Test de connexion rapide

Pour tester si Supabase est accessible, ouvrez la console du navigateur et exécutez :

```javascript
// Vérifier les variables d'environnement
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurée' : 'Manquante');

// Tester la connexion
fetch('https://vufrsgvhkeinifqmouei.supabase.co/rest/v1/', {
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  }
})
.then(r => console.log('✅ Connexion OK'))
.catch(e => console.error('❌ Erreur:', e));
```

## 📋 Checklist de dépannage

- [ ] Le fichier `.env` existe et contient les bonnes valeurs
- [ ] Le serveur de développement a été redémarré après modification de `.env`
- [ ] Les variables d'environnement sont configurées en production
- [ ] L'URL Supabase est correcte et accessible
- [ ] La clé API (anon key) est correcte
- [ ] Les URLs sont configurées dans Supabase (Site URL et Redirect URLs)
- [ ] Le projet Supabase est actif
- [ ] La connexion internet fonctionne
- [ ] Aucun firewall ne bloque les requêtes

## 🆘 Si rien ne fonctionne

1. **Vérifiez les logs Supabase :**
   - Allez dans **Logs > API** dans Supabase
   - Regardez si des requêtes arrivent

2. **Testez avec un autre projet Supabase :**
   - Créez un nouveau projet de test
   - Utilisez ses credentials pour voir si le problème vient de votre projet

3. **Contactez le support :**
   - Si le problème persiste, vérifiez les [forums Supabase](https://github.com/supabase/supabase/discussions)
   - Ou contactez le support Supabase

## 💡 Messages d'erreur courants

| Message | Cause | Solution |
|---------|-------|----------|
| "Failed to fetch" | Connexion impossible | Vérifiez l'URL et la connexion internet |
| "CORS policy" | Configuration CORS | Configurez les URLs dans Supabase |
| "Invalid API key" | Clé incorrecte | Vérifiez VITE_SUPABASE_ANON_KEY |
| "Project not found" | URL incorrecte | Vérifiez VITE_SUPABASE_URL |
| "Network error" | Problème réseau | Vérifiez votre connexion |

---

**Besoin d'aide supplémentaire ?** Consultez `SUPABASE_SETUP.md` pour la configuration complète.

