# Guide d'Installation SQL - ImmoGest

Ce guide vous explique comment configurer l'ensemble de votre base de données Supabase pour ImmoGest en exécutant un unique script SQL.

---

## 🚀 Installation

1. **Ouvrez votre projet Supabase**
2. **Allez dans SQL Editor** (dans le menu de gauche)
3. **Créez une nouvelle requête** ("New Query")
4. **Copiez tout le contenu de `supabase-setup-complete.sql`**
5. **Collez-le dans l'éditeur SQL**
6. **Cliquez sur "Run" (ou F5 / Ctrl+Enter)**

Le script est entièrement idempotent : il peut être réexécuté en toute sécurité sans altérer vos données existantes.

---

## 📊 Structure de la Base de Données

Le script crée automatiquement les 7 tables suivantes dans le schéma `public` :

### 1. `profiles`
Stocke les profils utilisateurs. Un profil est automatiquement inséré par un trigger de base de données à chaque fois qu'un utilisateur s'enregistre via Supabase Authentication.
- `id` (UUID, Primary Key, référence `auth.users`)
- `email` (TEXT)
- `full_name` (TEXT)

### 2. `properties`
Contient les biens immobiliers du propriétaire.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `name` (TEXT) - Nom de la propriété
- `type` (TEXT) - Studio, Appartement, Maison...
- `status` (TEXT) - loué ou vacant
- `monthly_rent` (NUMERIC) - Loyer mensuel recommandé
- *et autres détails physiques (surface_area, rooms, address, etc.)*

### 3. `tenants`
Stocke les locataires actifs ou passés et les lie à une propriété.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `property_id` (UUID, référence `public.properties`)
- `full_name` (TEXT)
- `monthly_rent` (NUMERIC) - Loyer du contrat
- `payment_day` (INTEGER) - Jour du mois pour l'échéance du loyer (1-31)

### 4. `payments`
Enregistre l'historique des loyers dus, payés et en retard.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `tenant_id` (UUID, référence `public.tenants`)
- `property_id` (UUID, référence `public.properties`)
- `amount` (NUMERIC)
- `due_date` (DATE)
- `paid_date` (DATE)
- `status` (TEXT) - payé, en attente, en retard

### 5. `payment_notifications`
Suivi des relances et notifications envoyées par email aux locataires.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `tenant_id` (UUID, référence `public.tenants`)
- `payment_id` (UUID, référence `public.payments`)
- `notification_date` (DATE)
- `email_sent` (BOOLEAN)

### 6. `expenses`
Enregistre les dépenses du propriétaire liées à la gestion ou aux travaux de ses biens.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `property_id` (UUID, référence `public.properties`)
- `category` (TEXT) - maintenance, taxes, assurance, réparation...
- `amount` (NUMERIC)
- `expense_date` (DATE)

### 7. `contracts`
Stocke les contrats physiques téléversés par le propriétaire.
- `id` (UUID, Primary Key)
- `user_id` (UUID, référence `auth.users`)
- `title` (TEXT)
- `tenant_name` (TEXT)
- `property_name` (TEXT)
- `file_path` (TEXT) - Chemin relatif dans le bucket storage
- `file_url` (TEXT) - URL de téléchargement publique/privée

---

## 🔒 Sécurité et RLS (Row Level Security)

Pour garantir la confidentialité des données entre propriétaires :
- RLS est **activé** sur les 7 tables.
- Chaque utilisateur authentifié peut uniquement voir, insérer, modifier ou supprimer ses propres lignes (`auth.uid() = user_id`).
- Un dossier de stockage privé est configuré dans le bucket `contracts` sous la forme `bucket/id_utilisateur/...` empêchant un utilisateur d'accéder aux fichiers contractuels d'un autre utilisateur.
