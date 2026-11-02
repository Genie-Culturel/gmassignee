# GMassignee - Module Procédures VR Center

Application de gestion des Game Masters pour Génie Culturel (VR Center Valais & Escape Life).

## 🆕 Nouveau module : Procédures VR

Ce module transforme les procédures PDF du VR Center en un outil interactif pour les GMs.

### Structure du module

Le module est composé de **deux parties liées** :

#### 1. **Suivi des parties** (opérationnel)
- **Mode Session** : accompagner les clients étape par étape (arrivée → check-in → briefing → jeu → débriefing → nettoyage)
- **Check-in GM** : pointage d'arrivée avec contrôle du retard (45 min avant l'événement)
- **Checklists** : ouverture, fermeture, ménage hebdomadaire
- **Incidents** : signalement (bug, malaise, casse) avec ouverture automatique des fiches de dépannage

#### 2. **Formation technique** (référence/training)
- Bibliothèque de **fiches procédurales** (courtes cartes avec étapes)
- 6 catégories : Configuration matériel, Lancement jeux, Dépannage, Nettoyage, Expérience client, Sécurité
- **Admin-éditable** (structure en base de données)
- Fiches seeds avec contenu réel des docs + placeholders **🚧 à compléter** pour Quest 3

#### 🔗 Le lien entre les deux
- Chaque étape de session ou item de checklist peut afficher un bouton **« Comment faire ? »** qui ouvre les fiches associées dans un drawer
- Les **incidents** ouvrent automatiquement la fiche de dépannage correspondante
- Les fiches sont réutilisables : même contenu dans Formation et dans le contexte opérationnel

## 🧪 Tester le module (mode démo)

Le module fonctionne en **mode démo** (données locales) par défaut. Aucune base de données n'est requise pour tester l'interface.

### Installation et lancement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvre [http://localhost:8080](http://localhost:8080) dans ton navigateur.

### Navigation

- **Dashboard** : vue d'ensemble et intro au module
- **Suivi parties** : mode Session, check-in, checklists
- **Formation** : browse des fiches techniques par catégorie

### Tester le mode Session

1. Va dans **Suivi parties**
2. Clique sur **Démarrer la session**
3. Coche les étapes au fur et à mesure
4. Clique sur **« Comment faire ? »** pour voir les fiches associées
5. Signale un incident (Bug, Malaise, Casse) → la fiche de dépannage s'ouvre automatiquement
6. Termine la session

## 🗄️ Configuration Supabase (optionnel, pour tester avec une vraie base)

Par défaut, le module tourne en mode démo. Pour le connecter à Supabase :

### 1. Créer un projet Supabase

Va sur [https://supabase.com](https://supabase.com) et crée un nouveau projet (gratuit).

### 2. Appliquer les migrations

Dans le dashboard Supabase (SQL Editor), exécute les fichiers dans l'ordre :

1. `supabase/migrations/001_vr_procedures.sql`
2. `supabase/migrations/002_seed_checklist_templates.sql`
3. `supabase/migrations/003_seed_procedure_fiches.sql`

### 3. Configurer les variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

Relance `npm run dev`.

## 📊 Modèle de données

### Tables principales

- **`procedure_fiches`** : bibliothèque de fiches (titre, catégorie, étapes, tags, placeholder)
- **`gm_checkins`** : pointages d'arrivée des GMs
- **`checklist_templates`** : items de checklist (ouverture, fermeture, ménage)
- **`checklist_completions`** : complétions par GM et par jour
- **`vr_sessions`** : sessions par événement (start, end, incident)
- **`session_steps`** : étapes complétées dans une session

### Tables de liaison

- **`session_step_fiches`** : lie chaque type d'étape à ses fiches
- **`checklist_template_fiches`** : lie chaque item de checklist à ses fiches

### RLS (Row Level Security)

- GMs lisent et écrivent leurs propres check-ins, completions, sessions
- Admins lisent tout, éditent les templates et fiches
- Fiches et liens : tout le monde lit, admin édite

## 🚧 Contenu à compléter

Les fiches marquées **🚧** sont des placeholders :

- **Configuration casques Quest 3** : allumage, lancement, Guardian, avatars
- **Recharge casques et manettes**
- **Lancement des jeux** (Serviteur I, Planta, Saga)
- **Dépannage** : bug/freeze, tracking perdu, matériel cassé
- **Nettoyage entre groupes** : produits, timing
- **Contre-indications et 10 commandements de la VR**

Ces fiches sont dans la base et l'interface, mais leur contenu doit être ajouté par un admin.

## 🏗️ Tech Stack

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : shadcn/ui (Radix + Tailwind CSS)
- **Backend** : Supabase (PostgreSQL + RLS)
- **State** : React hooks + TanStack Query (à ajouter si besoin de cache)
- **Routing** : React Router v6

## 📱 Design

- **Mobile-first** : GMs utilisent téléphones et tablettes
- **Design system** : couleurs, composants et tokens de GMassignee (shadcn/ui)
- **Tabs** : navigation principale en haut (Dashboard, Suivi parties, Formation)
- **Drawer/Sheet** : les fiches s'ouvrent sans quitter la session

## 🔒 Sécurité

- **Pas de secrets dans le code**
- **RLS Supabase** : GMs n'accèdent qu'à leurs propres données
- **Mode démo** : pas de connexion requise pour tester l'UI
- **Variables d'environnement** : `.env.local` dans `.gitignore`

## 🚀 Déploiement (Lovable)

L'application Lovable sync probablement la branche `main`. **Ne pas merger cette PR avant validation** :

1. Teste la branche `cursor/vr-procedures-module-783d`
2. Ajuste le contenu des fiches via l'interface admin (à construire) ou SQL
3. Valide avec quelques GMs
4. Merge dans `main` pour déployer

## 📝 Prochaines étapes (hors scope MVP)

- Interface admin pour éditer les fiches et checklists
- Lessons et quiz (utilise les fiches existantes)
- Checklists et procédures Escape Life
- Permissions et rôles (admin vs GM)
- Historique et analytics (retards, incidents, completion rates)
- Notifications (rappels check-in, tâches non complétées)

## 📧 Contact

Questions ou ajustements : voir Julien (admin Génie Culturel).

---

**Version** : MVP 1.0 (Module Procédures VR)  
**Date** : Nov 2026
