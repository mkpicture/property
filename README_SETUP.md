# Guide de Configuration - ImmoGest avec Supabase

## 🚀 Fonctionnalités Implémentées

✅ **Authentification complète avec Supabase**
- Inscription de nouveaux utilisateurs
- Connexion avec email/mot de passe
- Gestion de session automatique
- Protection des routes

✅ **Gestion des Contrats**
- Upload de fichiers PDF et Word (.pdf, .doc, .docx)
- Stockage sécurisé dans Supabase Storage
- Affichage de tous les contrats de l'utilisateur
- Téléchargement des contrats
- Suppression des contrats
- Recherche et filtrage
- Gestion des dates d'expiration

✅ **Interface Professionnelle**
- Design moderne et responsive
- Animations fluides
- Navigation intuitive
- Gestion d'erreurs avec toasts

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Un compte Supabase (gratuit)

## 🔧 Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer Supabase**
   - Suivez le guide détaillé dans `SUPABASE_SETUP.md`
   - Créez un projet Supabase
   - Exécutez le script SQL (`supabase-schema.sql`)
   - Créez le bucket de stockage `contracts`

3. **Configurer les variables d'environnement**
   - Créez un fichier `.env` à la racine du projet
   - Ajoutez vos clés Supabase :
     ```env
     VITE_SUPABASE_URL=https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
     ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur `http://localhost:8080`

## 📁 Structure du Projet

```
property-pal-main/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx      # Sidebar avec navigation
│   │   │   └── DashboardLayout.tsx # Layout principal
│   │   ├── ProtectedRoute.tsx      # Protection des routes
│   │   └── ui/                      # Composants UI (shadcn)
│   ├── contexts/
│   │   └── AuthContext.tsx          # Contexte d'authentification
│   ├── lib/
│   │   ├── supabase.ts              # Client Supabase
│   │   └── utils.ts                 # Utilitaires
│   ├── pages/
│   │   ├── Auth.tsx                 # Page d'authentification
│   │   ├── Contracts.tsx            # Page de gestion des contrats
│   │   ├── Dashboard.tsx            # Tableau de bord
│   │   └── ...
│   └── App.tsx                      # Composant principal
├── supabase-schema.sql              # Schéma de base de données
└── SUPABASE_SETUP.md                # Guide de configuration Supabase
```

## 🗄️ Base de Données

### Tables Créées

1. **profiles** - Profils utilisateurs
   - Extension de `auth.users`
   - Stocke le nom complet et l'email

2. **contracts** - Contrats de location
   - Lié à l'utilisateur via `user_id`
   - Stocke les métadonnées des fichiers
   - Gère les dates d'expiration

### Storage

- **Bucket `contracts`** - Stockage des fichiers PDF/Word
  - Structure : `{user_id}/{timestamp}.{extension}`
  - Politiques RLS activées
  - Limite de taille : 10MB (configurable)

## 🔐 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Les fichiers sont stockés de manière sécurisée
- Authentification gérée par Supabase Auth

## 📝 Utilisation

### Inscription
1. Allez sur `/auth`
2. Cliquez sur "Inscription"
3. Remplissez le formulaire (nom, email, mot de passe)
4. Confirmez votre email (si requis par Supabase)

### Ajouter un Contrat
1. Connectez-vous
2. Allez dans "Contrats" dans la sidebar
3. Cliquez sur "Ajouter un contrat"
4. Remplissez les informations :
   - Titre du contrat
   - Nom du locataire
   - Nom de la propriété
   - Date d'expiration (optionnel)
   - Fichier (PDF ou Word)
5. Cliquez sur "Enregistrer"

### Gérer les Contrats
- **Rechercher** : Utilisez la barre de recherche
- **Télécharger** : Cliquez sur "Télécharger" sur une carte de contrat
- **Supprimer** : Cliquez sur l'icône poubelle

## 🐛 Dépannage

### Erreur : "Les variables d'environnement Supabase ne sont pas configurées"
- Vérifiez que le fichier `.env` existe
- Vérifiez que les variables commencent par `VITE_`
- Redémarrez le serveur de développement

### Erreur lors de l'upload
- Vérifiez que le bucket `contracts` existe
- Vérifiez que le fichier ne dépasse pas 10MB
- Vérifiez que le type de fichier est autorisé (PDF/Word)

### Erreur d'authentification
- Vérifiez les Redirect URLs dans Supabase
- Vérifiez votre email de confirmation
- Vérifiez que les politiques RLS sont activées

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React Router](https://reactrouter.com/)
- [Documentation shadcn/ui](https://ui.shadcn.com/)

## 🎨 Améliorations Futures

- [ ] Prévisualisation des contrats
- [ ] Édition des métadonnées
- [ ] Export en masse
- [ ] Notifications d'expiration
- [ ] Signature électronique
- [ ] Versioning des contrats

## 📄 Licence

Ce projet est sous licence MIT.


