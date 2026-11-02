# GMassignee - Module Procédures VR Center

Application de gestion des Game Masters pour Génie Culturel (VR Center Valais & Escape Life).

## Structure du module

Deux parties liées :

### 1. Suivi des parties (opérationnel)

- **Mes sessions** : même structure que le dashboard GM GMassignee — **Mes Activités Aujourd'hui** et **Mes Prochaines Activités**. Chaque ligne : jeu + `[nb joueurs]`, badge Assigné, date, créneau début–fin. Un clic démarre / reprend la session pré-remplie. Un bandeau rappelle de démarrer **à l'arrivée** : `started_at` = heure d'arrivée GM, chaque étape cochée garde `completed_at`.
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

## Lancer l'app

```bash
git pull origin main
npm install
npm run dev
```

Ouvre [http://localhost:8080](http://localhost:8080).

À l'entrée : écran PIN (même principe que le Bug reporter). Code **1950**, mémorisé dans `localStorage`. Ensuite seulement : login Supabase ou mode démo.

Par défaut l'app se connecte au projet Supabase **gm-vrcenter** (URL + clé publishable dans `src/lib/config.ts`, surcharge possible via `.env.local`).

### Mode démo (fallback)

Les données restent locales (rien n'est écrit en base) si :

- `?demo=1` dans l'URL (ou `#/dashboard?demo=1`)
- toggle « Passer en mode démo » dans le pied de page (`localStorage`)
- `VITE_FORCE_DEMO=true`

Le login n'est pas demandé en mode démo.

### Login GM

Écran e-mail / mot de passe (connexion ou création de compte).

**Créer le premier compte :**

1. Ouvre l'app (pas en mode démo) → **Créer un compte GM**
2. Ou dans Supabase → Authentication → Users → Add user (e-mail + mot de passe)
3. Si la confirmation e-mail est activée : confirme le mail, ou désactive « Confirm email » (Authentication → Providers → Email) le temps du rollout
4. Pour un **admin** : Authentication → user → `app_metadata` :

```json
{ "role": "admin" }
```

`is_admin()` (migration 008) lit ce champ. Le claim JWT `role` reste `authenticated`.

## Sessions assignées (planning GMassignee)

Les vraies assignations vivent dans l'app Lovable **GMassignee** (autre projet Supabase, pas encore branché).

Ce module passe par une petite abstraction :

```ts
getAssignedSessions(gmId): Promise<AssignedSession[]>
```

- **Mode démo** : mock dans `src/lib/assignedSessions.ts` — au moins une session **aujourd'hui** (date calculée dynamiquement, créneau proche de l'heure actuelle) + les prochaines activités.
- **Plus tard** : remplacer `fetchFromGmassigneePlanning()` pour lire les tables planning (events / assignments) et mapper vers `AssignedSession` (`game`, `playerCount`, `date`, `startTime`, `endTime`, `status`). L'UI « Mes Activités Aujourd'hui / Mes Prochaines Activités » n'a pas besoin de changer.

Chaque ligne affiche `Jeu [nb joueurs]`, badge **Assigné**, date longue (`vendredi 6 novembre 2026`) et créneau (`14:30 - 16:25`). Un clic démarre / reprend la session pré-remplie ; le chevron déplie le détail.

Les infos de session suivent tout le flux : en-tête, ventes, notes, pré-remplissage du bug reporter (`game`, `date`, `time`, `panel`, `gm`, `ref`).

## Parcours

Définis en données dans `src/lib/parcours.ts`. Un seul pour l'instant :

- **Parcours client VR au centre** (14 étapes existantes)

D'autres (EscapeLife Sion, EscapeLife Sierre, Chandoline…) s'ajoutent comme nouvelles entrées dans `PARCOURS`, sans réécrire l'écran Session.

## Bug reporter

Constante `BUG_REPORTER_BASE_URL` dans `src/lib/constants.ts`.

URL : `https://genie-culturel.github.io/Bug_report_VR/?game=...&date=YYYY-MM-DD&time=HH:MM&panel=N&gm=...&remarks=...&ref=<vr_sessions.id>&session_id=<vr_sessions.id>&autostart=1`

`session_id` est l'UUID `vr_sessions.id` (le bug reporter le pose dans `bug_sessions.vr_session_id`). `ref` reste le même id. La vue Session liste les `bug_entries` de cette session (via `vr_session_id` ou `ref`).

## Configuration Supabase

Défaut (commité, clé publishable publique) : projet `gm-vrcenter`.

Surcharge optionnelle dans `.env.local` :

```env
VITE_SUPABASE_URL=https://vxeprhyswkqugyewpwfm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_…
VITE_FORCE_DEMO=true
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
| `011_session_persistence.sql` | Colonnes de reprise (`game`, `session_date`, `session_time`, `player_count`, `parcours_id`, `assignment_id`, `gm_name`), `event_id` nullable, unique étape |

Sur **gm-vrcenter**, 001–011 sont déjà appliqués. Toute nouvelle schema = **012+**.

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

## Démo GitHub Pages (test téléphone)

Workflow `.github/workflows/deploy-pages.yml` : build Vite en **mode démo** (pas de secrets), `base` = `/gmassignee/`, HashRouter.

URL attendue : [https://genie-culturel.github.io/gmassignee/](https://genie-culturel.github.io/gmassignee/)  
(routes : `/#/dashboard`, `/#/suivi-parties`, `/#/formation`)

Le premier déploiement a **buildé** mais n'a pas pu publier tant que Pages n'est pas activé.

À faire une fois (owner, dans GitHub) :

1. Repo → **Settings → Pages**
2. Build and deployment → Source : **GitHub Actions**
3. Relancer le workflow : **Actions → Deploy demo to GitHub Pages → Run workflow**

Le repo est **privé** et n'a pas été rendu public. Sur un plan GitHub Free, Pages n'est disponible que pour les repos publics ; un repo privé nécessite Pro / Team / Enterprise. Si GitHub refuse l'activation, garder le repo privé et tester en local (`npm run dev`).

## Contact

Questions : Julien (admin Génie Culturel).
