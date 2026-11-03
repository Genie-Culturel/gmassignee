# GMassignee - Module Procédures VR Center

Application de gestion des Game Masters pour Génie Culturel (VR Center Valais & Escape Life).

## Structure du module

Deux parties liées :

### 1. Suivi des parties (opérationnel)

- **Mes sessions** : même structure que le dashboard GM GMassignee — **Mes Activités Aujourd'hui** et **Mes Prochaines Activités**. Chaque ligne : jeu + `[nb joueurs]`, badge Assigné, date, créneau début–fin. Un clic démarre / reprend la session pré-remplie. Un bandeau rappelle de démarrer **à l'arrivée** : `started_at` = heure d'arrivée GM, chaque étape cochée garde `completed_at`.
- **Démarrage manuel** : fallback si la partie n'est pas dans le planning. Le GM choisit le **jeu** (noms officiels de la table `games`) ; le parcours du lieu du jeu est pris automatiquement.
- **Vidéos clients** : depuis le suivi de session, le GM envoie 1–2 vidéos (téléphone perso) vers un bucket privé `session-media` (TUS, 50 Mo/fichier en plan gratuit). Un e-mail chaleureux part au client (Resend) avec une page de téléchargement valable 14 jours ; les fichiers sont ensuite supprimés. En mode démo, upload et envoi sont simulés localement.
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

Onglets : les 3 catégories (+ **Admin** si `is_admin`). Badge `3/31` rouge tant qu’il reste des fiches à valider, vert si tout est ok. Chaque fiche a un statut à faire / validée / à revalider ; le GM valide (« J’ai lu et compris » + QCM). Une modification incrémente `version` (sauf correction mineure).

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

Un parcours par lieu, stocké en base (`parcours` + `parcours_steps`, migration 018) et modifiable dans **Formations → Admin → Parcours** :

| Lieu | Jeux | Parcours (`parcours.id`) | Étapes |
|---|---|---|---|
| Virtual Reality Center | Bataille de la Planta, Le Serviteur 1 & 2, La Saga, Schoolcrafter | `vr_centre_client` | 17 |
| Escape Life Sion | Da Vinci Code | `escape_life_sion` | 16 (2 « Option Vinum ») |
| Escape Life Sierre | Le Feu sacré | `escape_life_sierre` | 14 (version 1 équipe) |
| Usine de Chandoline | Novasphère | `chandoline` | 11, provisoire |

- Au démarrage, le jeu donne le lieu, donc le parcours (titre du planning rapproché du nom officiel via `resolveGameByName`).
- Les étapes actives sont copiées dans `vr_sessions.steps_snapshot` : modifier un parcours ne change pas les parties déjà commencées. Les anciennes sessions (sans snapshot) utilisent le parcours actuel.
- `session_steps.step` est du texte (ex-enum) : les clés VR historiques sont inchangées ; les autres lieux utilisent `sion_*`, `sierre_*`, `nova_*`.
- L'encadré d'envoi des vidéos n'apparaît que si le parcours contient l'étape `videos_sent` (VR Center, Chandoline ; pas Sion ni Sierre).
- Admin : glisser ⋮⋮ pour réordonner (appui long sur mobile), nom, rappel et condition modifiables, case Active, suppression logique (`deleted_at`).
- Fiches « Comment faire ? » : sous chaque étape, « + Lier une fiche… » (fiches actives globales, du lieu ou de ses jeux) et × pour délier. Liens dans `session_step_fiches` (`parcours_id` + `step`), écriture admin seulement.
- Contenu des fiches d’étapes : `scripts/parcours_fiches_data.py` → `python3 scripts/gen_parcours_fiches.py` régénère la migration 021 et `src/lib/demoParcoursFiches.ts` (mode démo).
- Mode démo : mêmes 4 parcours dans `src/lib/parcours.ts` (modifs admin en localStorage).

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
| `012_gm_training.sql` | Formation obligatoire : `version` / `is_required` sur les fiches, `quiz_questions`, `fiche_validations`, triggers de version, RPC quiz sans exposer les bonnes réponses |
| `013_session_media.sql` | Vidéos clients : `client_email` / `videos_sent_at` / `videos_download_token` sur `vr_sessions`, table `session_media`, bucket privé `session-media` (50 Mo), RLS, `cleanup_expired_session_media()` |
| `014_soft_delete_fiches.sql` | Suppression logique des fiches : `procedure_fiches.deleted_at` (distinct de `is_active`). L’historique `fiche_validations` est conservé. |
| `015_fiche_locations_games.sql` | Lieux (`locations`) et jeux (`games`), portée des fiches (`scope_kind` + `fiche_scope_locations` / `fiche_scope_games`). Seed VR Center / Chandoline / Sion / Sierre. Les fiches existantes sont rattachées au VR Center ; les lancements Planta / Saga / Serviteur sont rattachés au jeu. |
| `016_fiche_sort_order.sql` | Ordre manuel des fiches : `procedure_fiches.sort_order` par catégorie, initialisé sur l’ordre actuel. Le trigger de version ignore ce champ. |
| `017_game_official_names.sql` | Noms officiels des jeux (Bataille de la Planta, Novasphère, Da Vinci Code, Le Feu sacré…). |
| `018_parcours_per_location.sql` | Parcours par lieu : tables `parcours` / `parcours_steps` (RLS lecture authentifiée, écriture admin), seed des 4 parcours, `session_steps.step` et `session_step_fiches.step` en texte, `vr_sessions.steps_snapshot`. |
| `019_placeholder_fiches_nova_schoolcrafter.sql` | Fiches 🚧 « Procédure Novasphère » et « Procédure GM Schoolcrafter » (à compléter), rattachées à leur jeu. |
| `020_step_fiches_per_parcours.sql` | `session_step_fiches.parcours_id` (liens fiche ↔ étape par parcours, unique `(parcours_id, step, fiche_id)`), liens VR existants rattachés à `vr_centre_client`. |
| `021_parcours_step_fiches_content.sql` | 13 fiches d’étapes (Escape Life, Da Vinci Code, Le Feu sacré, VR, 🚧 Novasphère) et leurs liens : chaque étape active des 4 parcours a « Comment faire ? ». Généré par `scripts/gen_parcours_fiches.py`. |

Sur **gm-vrcenter**, 001–**023** sont appliqués. `pg_cron` n’est pas activé sur le plan gratuit : la purge 14 jours passe par l’edge function `cleanup-session-media` (ou un appel SQL manuel à `cleanup_expired_session_media()`).

### Secrets e-mail / nettoyage (à configurer)

Projet `gm-vrcenter` (`vxeprhyswkqugyewpwfm`), plan **gratuit** pour l’instant (50 Mo/fichier, 1 Go total).

Dans **Supabase → Project Settings → Edge Functions → Secrets** :

| Secret | Obligatoire | Valeur |
| --- | --- | --- |
| `RESEND_API_KEY` | pour l’envoi auto | clé API Resend (ne pas committer) |
| `EMAIL_FROM` | pour l’envoi auto | expéditeur vérifié, ex. `VR Center Valais <souvenirs@ton-domaine.ch>` |
| `CRON_SECRET` | pour le cron de purge | chaîne aléatoire longue ; header `x-cron-secret` ou `?secret=` sur `cleanup-session-media` |
| `PUBLIC_APP_URL` | non | URL publique de l’app (défaut `https://genie-culturel.github.io/gmassignee`) ; sert au lien envoyé aux clients |

**Lien client (souvenirs)** : `https://genie-culturel.github.io/gmassignee/souvenirs/?token=<uuid>` — page publique (sans PIN ni login) qui appelle `session-media-download?format=json`. L’ancienne URL de la fonction redirige (302) vers cette page. Côté app, la base vient de `VITE_PUBLIC_APP_URL` (même défaut).

Chez **Resend** : vérifier le domaine d’envoi (SPF/DKIM) ; sans ça `EMAIL_FROM` sera refusé.

Sans `RESEND_API_KEY` / `EMAIL_FROM`, la fonction **ne plante pas** : l’app affiche le lien de téléchargement à copier + un bouton `mailto` prérempli.

**Plan Pro plus tard** : augmenter `storage.buckets.file_size_limit` du bucket `session-media` (aujourd’hui 52 428 800) et `SESSION_MEDIA_MAX_BYTES` dans `src/lib/sessionMedia.ts`. L’upload TUS est déjà en place.

**Purge 14 jours** : `cleanup_expired_session_media()` + tentative `pg_cron` `20 3 * * *`. Si pg_cron n’est pas dispo (cas actuel), planifier un appel quotidien à `https://vxeprhyswkqugyewpwfm.supabase.co/functions/v1/cleanup-session-media` avec `CRON_SECRET`.

Pour qu'un compte soit admin, dans Authentication → user → `app_metadata` :

```json
{ "role": "admin" }
```

### RLS

- GMs : leurs check-ins, completions, sessions, leurs propres `fiche_validations`
- Admins (`app_metadata.role = admin`) : lecture globale + édition templates / fiches / produits / questions
- Quiz : les GM lisent les questions via `get_quiz_questions` (sans `correct_choice_ids`) ; la notation passe par `submit_fiche_validation`
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
