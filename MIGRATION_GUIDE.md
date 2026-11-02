# Guide de migration - Module Procédures VR

Ce guide explique comment appliquer les migrations SQL et tester le nouveau module.

## ⚠️ Important

**NE PAS exécuter ces migrations contre la base de données de production.**

Crée un projet Supabase de test/staging pour valider le module d'abord.

## 📋 Étapes

### 1. Créer un projet Supabase de test

1. Va sur [https://supabase.com](https://supabase.com)
2. Clique sur **New Project**
3. Choisis un nom (ex: `gmassignee-test`)
4. Note l'URL du projet et la clé anon key

### 2. Appliquer les migrations

Dans le dashboard Supabase, va dans **SQL Editor** et exécute les fichiers dans l'ordre :

#### Migration 1 : Structure des tables

Fichier : `supabase/migrations/001_vr_procedures.sql`

Cette migration crée :
- Les types enum (checklist_type, session_step, fiche_category, incident_type)
- Les tables (procedure_fiches, gm_checkins, checklist_templates, etc.)
- Les tables de liaison (session_step_fiches, checklist_template_fiches)
- Les index et les politiques RLS

**Temps estimé** : ~5 secondes

#### Migration 2 : Seed checklists

Fichier : `supabase/migrations/002_seed_checklist_templates.sql`

Cette migration ajoute :
- 8 items de checklist d'ouverture
- 8 items de checklist de fermeture
- 13 items de ménage hebdomadaire
- Les liens checklist → fiches

**Temps estimé** : ~2 secondes

#### Migration 3 : Seed fiches procédurales

Fichier : `supabase/migrations/003_seed_procedure_fiches.sql`

Cette migration ajoute :
- ~12 fiches techniques (matériel, jeux, dépannage, nettoyage, client, sécurité)
- Les liens étapes de session → fiches

**Temps estimé** : ~3 secondes

### 3. Vérifier les données

Dans **Table Editor**, vérifie que tu as :

- **procedure_fiches** : 8+ rows
- **checklist_templates** : 29 rows (8 + 8 + 13)
- **session_step_fiches** : quelques rows (liens étapes → fiches)
- **checklist_template_fiches** : quelques rows (liens checklist → fiches)

Les autres tables sont vides (gm_checkins, vr_sessions, etc.) : elles se remplissent quand les GMs utilisent l'app.

### 4. Connecter l'app au projet test

Crée un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://ton-projet-test.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon
```

Lance l'app :

```bash
npm run dev
```

### 5. Tester

1. **Formation technique** : vérifie que les 8+ fiches apparaissent, par catégorie
2. **Suivi parties** : démarre une session, coche des étapes, clique sur « Comment faire ? »
3. **Incidents** : signale un incident → la fiche de dépannage doit s'ouvrir

### 6. Ajuster le contenu

Les fiches marquées **🚧 à compléter** ont un contenu placeholder. Pour les remplir :

#### Option A : Via SQL (temporaire)

```sql
UPDATE procedure_fiches
SET 
  content_steps = '[
    {"order": 1, "text": "Étape 1 réelle"},
    {"order": 2, "text": "Étape 2 réelle"}
  ]'::jsonb,
  is_placeholder = false
WHERE title = '🚧 Configuration casques Quest 3';
```

#### Option B : Via une interface admin (à construire)

L'interface admin n'est pas dans le MVP, mais elle permettrait d'éditer les fiches directement depuis l'app (CRUD sur `procedure_fiches`).

## 🔄 Rollback (annuler les migrations)

Si besoin de repartir de zéro :

```sql
DROP TABLE IF EXISTS session_steps CASCADE;
DROP TABLE IF EXISTS session_step_fiches CASCADE;
DROP TABLE IF EXISTS vr_sessions CASCADE;
DROP TABLE IF EXISTS checklist_completions CASCADE;
DROP TABLE IF EXISTS checklist_template_fiches CASCADE;
DROP TABLE IF EXISTS checklist_templates CASCADE;
DROP TABLE IF EXISTS gm_checkins CASCADE;
DROP TABLE IF EXISTS procedure_fiches CASCADE;

DROP TYPE IF EXISTS session_step CASCADE;
DROP TYPE IF EXISTS fiche_category CASCADE;
DROP TYPE IF EXISTS checklist_type CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Puis réexécute les migrations 1, 2, 3.

## 🚀 Migration vers production

Une fois validé sur le projet test :

1. **Backup** de la base de production (Supabase > Settings > Database > Backup)
2. Exécute les migrations sur la prod (même ordre)
3. Vérifie les données
4. Teste avec un GM pilote
5. Annonce le rollout à l'équipe

## ❓ Questions fréquentes

**Q : Les migrations suppriment-elles des données existantes ?**  
R : Non. Elles créent de nouvelles tables. Les tables existantes (events, users, etc.) ne sont pas touchées.

**Q : Que faire si une migration échoue ?**  
R : Lis le message d'erreur. Les causes courantes :
- Table déjà existante → DROP la table d'abord
- Type enum déjà existant → DROP le type d'abord
- Permission insuffisante → vérifie que tu es admin du projet

**Q : Peut-on modifier les fiches seeds après la migration ?**  
R : Oui, via SQL ou une interface admin. Les seeds sont juste un point de départ.

**Q : Comment ajouter une nouvelle fiche ?**  
R : INSERT dans `procedure_fiches`, puis éventuellement INSERT dans `session_step_fiches` ou `checklist_template_fiches` pour la lier.

## 📧 Support

Besoin d'aide ? Contacte le développeur via le repo GitHub ou Cursor AI.
