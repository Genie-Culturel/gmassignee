# Rôle « Formateur et suivi sessions »

## Vue d'ensemble

Le rôle **`formateur_suivi`** (libellé « Formateur et suivi sessions ») donne accès aux fonctionnalités de gestion des sessions et des formations, sans les privilèges d'administrateur Lovable complets.

### Slug / Nom technique
- **Enum**: `formateur_suivi` (valeur dans `public.app_role`)
- **Libellé UI**: « Formateur et suivi sessions »

---

## Permissions accordées

Un utilisateur avec le rôle `formateur_suivi` peut :

### 1. Sessions VR (Dashboard / Historique des sessions)
- ✅ **Voir toutes les sessions** de tous les GMs (lecture complète de `gh_vr_sessions`)
- ✅ **Consulter les détails** : étapes (`gh_session_steps`), ventes (`gh_session_sales`), médias (`gh_session_media`), bugs, notes
- ✅ **Supprimer des sessions** (via RPC `gh_admin_delete_session()`)
- ✅ **Marquer comme revu** (via RPC `gh_set_session_flag_reviewed()`)
- ✅ **Accès au Dashboard "Sessions enregistrées"** (composant `SessionMediaAdmin`)
- ✅ **Sélection et suppression en masse** de sessions

### 2. Formations & Procédures (Formation technique)
- ✅ **Éditer toutes les fiches** de formation (`gh_procedure_fiches`)
- ✅ **Gérer les quiz** (`gh_quiz_questions`) : création, modification, suppression
- ✅ **Voir toutes les validations** des GMs (`gh_fiche_validations`)
- ✅ **Gérer les parcours** (`gh_parcours_fiches`, `gh_step_fiches`)
- ✅ **Accès à l'onglet "Admin"** dans Formations (composant `TrainingAdmin`)
- ✅ **Voir les fiches inactives** (soft-deleted)

### 3. Suivi des GMs
- ✅ **Lister tous les profils GM** (via `gh_list_gm_profiles()`)
- ✅ **Voir tous les pointages** (`gh_gm_checkins`)
- ✅ **Voir toutes les complétions** de checklists (`gh_checklist_completions`)
- ✅ **Tableau de suivi des formations** (progression par GM)

---

## Différences avec le rôle `admin`

| Fonctionnalité | `admin` | `formateur_suivi` |
|----------------|---------|-------------------|
| Sessions : lecture, suppression, marquage revu | ✅ | ✅ |
| Formations : édition complète des fiches et quiz | ✅ | ✅ |
| Suivi des GMs : progression, validations | ✅ | ✅ |
| **Lovable admin** : gestion utilisateurs, projets, facturation, etc. | ✅ | ❌ |
| Autres privilèges Lovable (hors GitHub app) | ✅ | ❌ |

> **En résumé** : `formateur_suivi` = `admin` **uniquement** pour les fonctionnalités **sessions** et **formations** de l'app GitHub Pages GMassignee.

---

## Attribution du rôle

### Prérequis
- L'utilisateur doit avoir un compte Supabase Auth (`auth.users`)
- Seul un **admin** peut attribuer le rôle `formateur_suivi`

### SQL pour attribuer le rôle

```sql
-- 1. Vérifier l'UUID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'julien@example.com';

-- 2. Attribuer le rôle formateur_suivi
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid-de-julien>', 'formateur_suivi')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Vérifier l'attribution
SELECT u.email, ur.role
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'julien@example.com';
```

### Retrait du rôle

```sql
DELETE FROM public.user_roles
WHERE user_id = '<uuid-de-julien>' AND role = 'formateur_suivi';
```

---

## Vérification côté code

### Backend (RLS / Fonctions SQL)
Les policies RLS et fonctions SQL utilisent la fonction helper :

```sql
public.has_formateur_role(user_id uuid DEFAULT auth.uid())
```

Cette fonction retourne `true` si l'utilisateur a le rôle `admin` **OU** `formateur_suivi`.

### Frontend (TypeScript)
Le hook `useAuth()` expose :

```typescript
const { isFormateur } = useAuth();
```

`isFormateur` est `true` si l'utilisateur a le rôle `admin` **OU** `formateur_suivi`.

---

## Migrations SQL

Le rôle a été ajouté via deux migrations :

### Migration 046 (initiale, incorrecte)
- Ajout de la valeur `formateur_suivi` à l'enum `app_role` ✅
- Création de la fonction `has_formateur_role(uuid)` ✅
- ❌ Ciblait par erreur les tables **sans préfixe** (Lovable, pas GitHub app)

### Migration 047 (correction)
- Corrige les policies RLS pour cibler les tables **`gh_*`** (GitHub app) :
  - `gh_vr_sessions`, `gh_session_steps`, `gh_session_sales`, `gh_session_media`
  - `gh_procedure_fiches`, `gh_quiz_questions`, `gh_fiche_validations`
  - `gh_checklist_templates`, `gh_gm_checkins`, `gh_checklist_completions`
  - `gh_parcours_fiches`, `gh_step_fiches`
- Corrige les fonctions RPC avec préfixe **`gh_`** :
  - `gh_admin_delete_session()`
  - `gh_list_gm_profiles()`
  - `gh_set_session_flag_reviewed()`
- Supprime les policies/fonctions incorrectes créées sur les tables sans préfixe

---

## Cas d'usage

### Julien — Formateur et suivi sessions
Julien forme les nouveaux GMs et assure le suivi qualité des sessions. Il a besoin de :
- Consulter toutes les sessions pour identifier les erreurs récurrentes
- Éditer les fiches de formation quand une procédure change
- Voir la progression de chaque GM dans les formations obligatoires
- Supprimer les sessions tests ou erronées

**Rôle attribué** : `formateur_suivi`

Julien **n'a pas besoin** de gérer les utilisateurs, la facturation, ou les projets Lovable → pas de rôle `admin` complet.

---

## Sécurité

- ✅ Le rôle `formateur_suivi` est **server-side** (table `user_roles`), pas client-side.
- ✅ Les permissions sont **enforced par RLS** : même si le frontend est modifié, les politiques SQL bloquent les requêtes non autorisées.
- ✅ Les fonctions RPC (`gh_admin_delete_session`, etc.) vérifient `has_formateur_role()` en `SECURITY DEFINER`.
- ✅ Le frontend affiche les écrans admin **uniquement si `isFormateur === true`**, mais la vraie protection est côté backend.

---

## Compatibilité

- ✅ Rétrocompatible : tous les utilisateurs avec `admin` gardent leurs permissions exactes.
- ✅ Les utilisateurs avec `formateur_suivi` uniquement **n'ont PAS** accès aux fonctionnalités Lovable admin hors GitHub app.
- ✅ Si un utilisateur a **les deux** rôles (`admin` ET `formateur_suivi`), seul `admin` est nécessaire (la fonction `has_formateur_role` accepte les deux).

---

## Maintenance

### Ajouter une nouvelle table nécessitant des permissions formateur

Si une nouvelle table ou fonction doit être accessible aux formateurs :

1. Créer une migration SQL qui ajoute une policy utilisant `has_formateur_role()` :

```sql
CREATE POLICY "Formateurs can manage new_table"
  ON public.gh_new_table FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());
```

2. Si c'est une fonction RPC, ajouter la vérification :

```sql
IF NOT public.has_formateur_role() THEN
  RAISE EXCEPTION 'Réservé aux administrateurs et formateurs' USING errcode = '42501';
END IF;
```

### Modifier le libellé UI

Le libellé « Formateur et suivi sessions » est dans :
- `Layout.tsx` (ligne ~29) : affiche « formateur » dans le header
- Cette documentation

Pour changer le libellé, mettre à jour ces fichiers + les commentaires SQL.

---

**Documentation créée le 5 novembre 2026**  
**Dernière mise à jour : 5 novembre 2026**
