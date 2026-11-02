# GMassignee - Module Procédures VR Center

Application de gestion des Game Masters pour Génie Culturel (VR Center Valais & Escape Life).

## Structure du module

Deux parties liées :

### 1. Suivi des parties (opérationnel)

- **Mes sessions** : parties assignées au GM connecté (aujourd'hui d'abord, puis à venir). Un clic démarre la session déjà pré-remplie (jeu, date/heure, groupe, nombre de joueurs).
- **Démarrage manuel** : fallback si la partie n'est pas dans le planning. Le GM choisit le **parcours** (aujourd'hui un seul : « Parcours client VR au centre », 14 étapes).
- **Incidents** : Bug / Freeze ouvre le [Bug reporter](https://genie-culturel.github.io/Bug_report_VR/) pré-rempli + la fiche de dépannage. Malaise / Casse / Autre gardent fiche + note ; Autre affiche aussi le lien bug reporter.
- **Ventes & encaissement** : lignes, CHF, Twint / Espèces / Carte / Facture.

### 2. Formations & Procédures (référence)

Bibliothèque de fiches en **3 catégories** :

| Catégorie | Contenu |
| --- | --- |
| Formation technique | Setup / matériel (Quest 3, recharge, lancement des jeux) |
| Procédure et déroulement | Parcours client et opérations |
| Dépannage & bugs | Problèmes en jeu, freeze, tracking, casse casque/manette |

Les fiches marquées **🚧** sont des placeholders « à compléter ».

Le bouton **« Comment faire ? »** dans une session ouvre la fiche associée sans quitter le flux.

## Mode démo

Sans `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, l'app tourne en **mode démo** (données locales, pas de secrets). C'est le mode du build GitHub Pages.

```bash
npm install
npm run dev
```

Ouvre [http://localhost:8080](http://localhost:8080).

- **Dashboard** : vue d'ensemble
- **Suivi parties** : Mes sessions → clic pour démarrer, ou formulaire manuel
- **Formations** : 3 onglets de fiches

## Sessions assignées (planning GMassignee)

Les vraies assignations vivent dans l'app Lovable **GMassignee** (autre projet Supabase, pas encore branché).

Ce module passe par une petite abstraction :

```ts
getAssignedSessions(gmId): Promise<AssignedSession[]>
```

- **Mode démo** : mock dans `src/lib/assignedSessions.ts` (sessions du jour + à venir).
- **Plus tard** : remplacer `fetchFromGmassigneePlanning()` pour lire les tables planning (events / assignments) et mapper vers `AssignedSession` (`game`, `date`, `time`, `groupName`, `playerCount`, `gmName`). Le reste de l'UI n'a pas besoin de changer.

Les infos de session suivent tout le flux : en-tête, ventes, notes, pré-remplissage du bug reporter (`game`, `date`, `time`, `panel`, `gm`, `ref`).

## Parcours

Définis en données dans `src/lib/parcours.ts`. Un seul pour l'instant :

- **Parcours client VR au centre** (14 étapes existantes)

D'autres (EscapeLife Sion, EscapeLife Sierre, Chandoline…) s'ajoutent comme nouvelles entrées dans `PARCOURS`, sans réécrire l'écran Session.

## Bug reporter

Constante `BUG_REPORTER_BASE_URL` dans `src/lib/constants.ts`.

URL : `https://genie-culturel.github.io/Bug_report_VR/?game=...&date=YYYY-MM-DD&time=HH:MM&panel=N&gm=...&remarks=...&ref=...&autostart=1`

## Configuration Supabase (optionnel)

Crée `.env.local` :

```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

### Migrations

À exécuter **dans l'ordre** (SQL Editor, un fichier = une transaction) :

| Fichier | Rôle |
| --- | --- |
| `001_vr_procedures.sql` | Tables, enums de base, RLS (sans `ALTER DATABASE jwt_secret`) |
| `002_seed_checklist_templates.sql` | Checklists ouverture / fermeture / ménage |
| `003_seed_procedure_fiches.sql` | Fiches techniques initiales |
| `003b_add_fiche_category_enum_values.sql` | `ALTER TYPE` : `parcours_client`, `formation_technique`, `procedure_deroulement` (fichier séparé : une nouvelle valeur d'enum ne peut pas être utilisée dans la même transaction) |
| `004_add_parcours_client_fiches.sql` | 14 fiches parcours client |
| `005_add_sales_and_payment.sql` | Catalogue ventes + `session_sales` |
| `006_restructure_formation_categories.sql` | Recatégorisation des fiches |
| `007_bug_reporter.sql` | `bug_sessions` / `bug_entries` |
| `008_fix_admin_rls.sql` | Admin = `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` |
| `009_add_depannage_bugs_enum.sql` | `ALTER TYPE` : `depannage_bugs` (fichier séparé) |
| `010_move_troubleshooting_to_depannage.sql` | Déplace les fiches Dépannage vers `depannage_bugs` |

Sur le projet déjà migré (001–007 + enum values déjà appliqués), n'exécuter que **008, 009, 010**.

Pour qu'un compte soit admin, dans Authentication → user → `app_metadata` :

```json
{ "role": "admin" }
```

### RLS

- GMs : leurs check-ins, completions, sessions
- Admins (`app_metadata.role = admin`) : lecture globale + édition templates / fiches / produits
- `auth.jwt() ->> 'role'` n'est **pas** le rôle applicatif (toujours `authenticated` sur Supabase hébergé)

## Tech

- React 18 + TypeScript + Vite
- shadcn/ui (Radix + Tailwind)
- Supabase (PostgreSQL + RLS)
- React Router v6 (**HashRouter** pour le démo GitHub Pages)

## Démo GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` : build Vite en mode démo (pas de secrets), `base` = `/gmassignee/`.

URL attendue : `https://genie-culturel.github.io/gmassignee/`

Le repo est **privé** : GitHub Pages sur un repo privé exige un plan Pro / Team / Enterprise. Si Pages refuse, le repo n'est pas rendu public.

## Contact

Questions : Julien (admin Génie Culturel).
