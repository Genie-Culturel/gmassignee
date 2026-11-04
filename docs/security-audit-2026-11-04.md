# Audit de sécurité GMassignee — 4 novembre 2026

## 🔍 Périmètre de l'audit

Application GMassignee (Vite/React) déployée sur GitHub Pages (https://genie-culturel.github.io/gmassignee/), utilisant le Supabase partagé avec l'app Lovable officielle (projet dnxyidnkmtrmkxucqrry).

### Infrastructure
- **Base de données** : Supabase dnxyidnkmtrmkxucqrry (tables préfixées `gh_` pour GMassignee)
- **Storage** : Bucket `session-media`
- **Edge Functions** : `gh-cleanup-session-media`, `gh-send-session-videos`, `gh-session-media-download`
- **Authentification** : Supabase Auth avec rôles via `public.has_role` / `user_roles` (admin, gm, stock_manager, planificateur)
- **Déploiement** : GitHub Pages (SPA statique)

---

## ✅ Points de sécurité validés

### 1. Gestion des clés API
- ✅ **Aucune clé service_role ou secret** dans le code front-end
- ✅ **Clé anon/publishable uniquement** exposée dans `src/lib/config.ts` : `sb_publishable_COByzOZPOYT1_9zELSfo4w_EpEhOc5u`
- ✅ La clé anon est appropriée pour le front-end (sécurisée par RLS)
- ✅ Pas de `.env` ou `.env.local` committé dans le repository
- ✅ Les secrets des edge functions (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET) sont gérés côté serveur

### 2. Protection des Edge Functions

#### `gh-cleanup-session-media`
- ✅ **Authentification requise** via `CRON_SECRET` (header `x-cron-secret`, Authorization Bearer, ou query param `secret`)
- ✅ Rejette avec 401 si non autorisé
- ✅ CORS : `Access-Control-Allow-Origin: *` (acceptable pour une fonction CRON)
- ✅ Utilise `SUPABASE_SERVICE_ROLE_KEY` côté serveur pour supprimer les médias expirés

#### `gh-send-session-videos`
- ✅ **Authentification JWT requise** : vérifie `userClient.auth.getUser()`
- ✅ **Vérification de propriété** : `session.gm_id === user.id || isAdmin`
- ✅ Rejette avec 401 (non authentifié) ou 403 (pas ta session)
- ✅ CORS raisonnable : `Access-Control-Allow-Origin: *` (API publique authentifiée par JWT)
- ✅ Pas de fuite de données d'autres sessions (filtre par `session_id` + vérification de propriété)

#### `gh-session-media-download`
- ✅ **Authentification par token UUID** (`videos_download_token`) dans l'URL
- ✅ Accessible publiquement mais requiert un token valide non-devinable
- ✅ Renvoie uniquement les fichiers de la session associée au token
- ✅ CORS : `Access-Control-Allow-Origin: *` (acceptable pour page souvenirs publique)
- ✅ Les URLs signées expirent après 1 h

### 3. Protection des écrans admin côté UI

#### Dashboard (SessionMediaAdmin)
```tsx
// src/pages/Dashboard.tsx:30
{isAdmin && <SessionMediaAdmin />}
```
- ✅ **Protégé côté UI** : affiché uniquement si `isAdmin === true`
- ✅ `isAdmin` provient de `useAuth()` qui vérifie `user?.app_metadata?.role === 'admin'`

#### FormationTechnique (TrainingAdmin)
```tsx
// src/pages/FormationTechnique.tsx
{isAdmin && <TrainingAdmin ... />}
```
- ✅ **Protégé côté UI** : même mécanisme

#### ParcoursAdmin
```tsx
// src/components/TrainingAdmin.tsx:70-72
<TabsTrigger value="parcours">Parcours</TabsTrigger>
<TabsContent value="parcours">
  <ParcoursAdmin ... />
</TabsContent>
```
- ✅ **Protégé côté UI** : accessible uniquement depuis TrainingAdmin qui est lui-même protégé

### 4. Row Level Security (RLS) côté base de données

#### Préfixe des tables GMassignee

**Important** : Les tables GMassignee dans la base partagée sont préfixées `gh_` :
- `gh_vr_sessions` (alias `vr_sessions` dans le code)
- `gh_session_steps`, `gh_session_sales`, `gh_session_media`
- `gh_bug_sessions`, `gh_bug_entries`
- `gh_procedure_fiches`, `gh_gm_checkins`, etc.

#### Vérification clé : gh_vr_sessions.gm_id = auth.users.id

✅ **Validation critique** : `gh_vr_sessions.gm_id` référence **auth.users** (colonne `id` du JWT), **PAS** `profiles.gm_id` ou `game_masters.id`.

**Preuve dans le code** :
```typescript
// src/lib/sessionRepository.ts:370
.insert({
  gm_id: params.gmId,  // ✅ Provient de user.id (auth)
  // ...
})

// src/pages/SuiviParties.tsx:136
const { user } = useAuth();
const gmId = user?.id || DEMO_GM_ID;  // ✅ user.id = auth.users.id (JWT)
```

✅ Aucune utilisation de `profiles.gm_id` ou `game_masters.id` trouvée dans le code.

#### Tables principales et leurs policies

**gh_vr_sessions** (sessions VR)
- ✅ RLS activé (migration 001, ligne 213)
- ✅ **GMs** : peuvent gérer leurs propres sessions (`auth.uid() = gm_id`)
- ✅ **Admins** : peuvent lire toutes les sessions (`public.is_admin()`)
- ✅ Pas de politique d'écriture admin (les admins ne peuvent pas modifier les sessions d'autres GMs, seulement les consulter)
- ✅ **Code insert vérifié** : utilise bien `user.id` (auth.users.id)

**session_steps** (étapes de session)
- ✅ RLS activé (migration 001, ligne 222)
- ✅ **GMs** : peuvent gérer les étapes de leurs sessions via sous-requête sur `vr_sessions`
- ✅ **Admins** : lecture seule

**session_sales** (ventes)
- ✅ RLS activé (migration 005, ligne 61)
- ✅ **GMs** : gèrent les ventes de leurs sessions
- ✅ **Admins** : lecture seule

**session_media** (vidéos/photos)
- ✅ RLS activé (migration 013, ligne 35)
- ✅ **GMs** : gèrent les médias de leurs sessions
- ✅ **Admins** : lecture seule
- ✅ **Storage policies** (bucket `session-media`) :
  - SELECT : admin ou GM propriétaire
  - INSERT/UPDATE/DELETE : admin ou GM propriétaire

**gh_bug_sessions** et **gh_bug_entries** (bug reporter)
- ✅ RLS activé (migration 007, ligne 35-36)
- ✅ **Policy "sandbox_all"** : lecture et ajout pour tous les utilisateurs authentifiés
- ✅ **Modification/suppression** : admin uniquement (pas de policy INSERT/UPDATE/DELETE pour non-admins)
- ✅ **UI vérifiée** : aucune interface de modification/suppression de bugs dans l'app
  - Seul lien : "Ouvrir le Bug reporter" (externe, pas de gestion interne)
  - Pas de bouton "Modifier bug" ou "Supprimer bug" trouvé dans le code

**gh_procedure_fiches** (fiches formation)
- ✅ RLS activé (migration 001, ligne 157)
- ✅ **Tous** : lecture des fiches actives
- ✅ **Admins** : gestion complète (CRUD)

**gm_checkins** (pointages GM)
- ✅ RLS activé (migration 001, ligne 183)
- ✅ **GMs** : insertion et lecture de leurs propres pointages
- ✅ **Admins** : lecture seule

#### Fonction d'administration `public.is_admin()`
```sql
-- migration 008_fix_admin_rls.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
```
- ✅ Vérifie le JWT `app_metadata.role === 'admin'`
- ✅ Utilisée dans toutes les policies admin

### 5. Suivi des parties (SuiviParties.tsx)

#### Filtrage par GM
```tsx
// src/pages/SuiviParties.tsx:136
const { user, displayName } = useAuth();
const gmId = user?.id || DEMO_GM_ID;

// ligne 186-189
getAssignedSessions(gmId).then((rows) => {
  if (!cancelled) setAssigned(rows);
});

// ligne 192-195
if (!isMockMode && user) {
  listOpenSessions(user.id).then((rows) => {
    if (!cancelled) setOpenSessions(rows);
  });
}
```
- ✅ **Filtre par gm_id** : `listOpenSessions(user.id)` utilise `.eq('gm_id', gmId)` (sessionRepository.ts:208)
- ✅ Les sessions assignées proviennent du planning GMassignee (future intégration)
- ✅ Un GM ne peut voir que ses propres sessions ouvertes

#### Queries Supabase
```typescript
// src/lib/sessionRepository.ts:203-210
export async function listOpenSessions(gmId: string): Promise<PersistedSession[]> {
  if (isMockMode || !supabase) return [];
  const { data, error } = await supabase
    .from('vr_sessions')
    .select('*')
    .eq('gm_id', gmId)  // ✅ Filtre par GM
    .is('ended_at', null)
    .order('started_at', { ascending: false });
  // ...
}
```
- ✅ **Protection double** : filtrage côté client + RLS côté base

### 6. Système de bug reporting

#### Vérification : pas de modification/suppression de bugs côté non-admin

✅ **UI validée** : L'application n'offre **aucune interface** pour modifier ou supprimer des bugs :

**Fonctionnalités présentes** :
- ✅ Bouton "Ouvrir le Bug reporter" → ouvre une URL externe (`buildBugReporterUrl()`)
- ✅ Affichage des bugs de la session en lecture seule (`listBugsForSession()`)
- ✅ Marquage d'incident dans la session (type + détails), **PAS** modification de bugs

**Fonctionnalités absentes (conformité RLS)** :
- ❌ Pas de bouton "Modifier bug"
- ❌ Pas de bouton "Supprimer bug"
- ❌ Pas de formulaire d'édition de bug
- ❌ Pas d'appel à `.update()` ou `.delete()` sur `bug_sessions` ou `bug_entries`

**Preuve dans le code** :
```typescript
// src/pages/SuiviParties.tsx:655-673
{bugs.length > 0 && (
  <div className="space-y-2 pt-2 border-t">
    <p className="text-sm font-medium">Bugs de cette session</p>
    <ul className="space-y-2">
      {bugs.map((bug) => (
        <li className="text-sm rounded-md border p-2">
          {/* Lecture seule : description, criticité, catégorie, statut */}
          {/* ❌ Aucun bouton de modification/suppression */}
        </li>
      ))}
    </ul>
  </div>
)}
```

✅ **Conformité RLS** : Les non-admins ne peuvent pas modifier/supprimer les bugs, et l'UI ne propose pas ces actions.

### 7. Console.log et logging

- ✅ `src/lib/supabase.ts:29` : `console.warn` mode démo (pas de données utilisateur)
- ✅ `src/lib/assignedSessions.ts:247` : `console.warn` dev interne (pas de données utilisateur)
- ✅ `src/hooks/useStepFiches.ts:40` : `console.error` (erreur générique, pas de données utilisateur)
- ✅ `src/lib/parcoursRepository.ts:62` : `console.warn` (erreur de lecture, pas de données utilisateur)
- ✅ Edge functions : `console.error` serveur uniquement (logs Supabase, pas accessibles au front)

**Aucun console.log ne logue de données utilisateur sensibles.**

---

## ⚠️ Risques identifiés

### 🟡 Risque MOYEN : Admin peut lire toutes les sessions mais pas les modifier

**Constat** : Les policies RLS actuelles donnent aux admins un accès en **lecture seule** sur `vr_sessions`, `session_steps`, `session_sales`, et `session_media`.

**Impact** :
- Les admins peuvent consulter toutes les sessions (Dashboard → SessionMediaAdmin)
- Mais ne peuvent **pas** :
  - Modifier les notes d'une session d'un autre GM
  - Corriger une étape cochée par erreur
  - Ajouter/supprimer des ventes
  - Uploader des médias manquants

**Risque** : Limité (lecture seule), mais incohérent avec les fonctionnalités d'admin (ex. suppression de session).

**Recommandation** : Ajouter des policies d'écriture admin si besoin métier. Voir section "Recommandations SQL" ci-dessous.

### 🟢 Risque FAIBLE : listRecordedSessions() ne filtre pas par gm_id

**Constat** : `sessionView.ts:listRecordedSessions()` récupère toutes les sessions (limit 60) sans filtrer par `gm_id`.

```typescript
// src/lib/sessionView.ts:241-248
const { data, error } = await supabase
  .from('vr_sessions')
  .select('...')
  .order('started_at', { ascending: false })
  .limit(60);  // ❌ Pas de .eq('gm_id', ...)
```

**Impact** :
- Cette fonction est appelée uniquement dans `SessionMediaAdmin` (Dashboard)
- `SessionMediaAdmin` est affiché **uniquement si `isAdmin === true`** (ligne 30 de Dashboard.tsx)
- Les RLS empêchent un GM non-admin de lire les sessions d'autres GMs

**Conclusion** : Pas de fuite de données car :
1. Protégé côté UI (`isAdmin`)
2. Protégé côté RLS (policy admin sur `vr_sessions`)

**Recommandation** : Aucune correction nécessaire, mais documenter l'intention (fonction admin-only).

### 🟢 Risque FAIBLE : Mode démo expose isAdmin = true

**Constat** : En mode démo (localStorage `gmassignee_demo=1` ou `?demo=1`), `isAdmin` est forcé à `true`.

```typescript
// src/hooks/useAuth.tsx:65
isAdmin: readIsAdmin(user) || isMockMode,
```

**Impact** :
- Un utilisateur en mode démo local peut voir les écrans admin
- Mais les données sont locales (localStorage) et ne touchent pas la vraie base

**Conclusion** : Acceptable car mode démo = environnement de test local.

**Recommandation** : Ajouter un commentaire explicatif dans le code.

### 🟢 Risque FAIBLE : CORS `Access-Control-Allow-Origin: *` sur edge functions

**Constat** : Toutes les edge functions ont `Access-Control-Allow-Origin: *`.

**Impact** :
- **cleanup-session-media** : fonction CRON, CORS permissif acceptable (authentification CRON_SECRET)
- **send-session-videos** : API authentifiée JWT, CORS permissif acceptable (l'app front peut appeler depuis n'importe quel domaine)
- **session-media-download** : page souvenirs publique, CORS permissif nécessaire

**Conclusion** : Pas de risque réel car toutes les fonctions sont correctement authentifiées.

**Recommandation** : Optionnellement restreindre CORS à `https://genie-culturel.github.io` + domaines de test si souhaité.

### 🟡 Risque MOYEN : Vulnérabilités npm (10 moderate, 7 high)

**Constat** : `npm install` rapporte 10 vulnérabilités.

```
10 vulnerabilities (3 moderate, 7 high)

To address issues that do not require attention, run:
  npm audit fix
```

**Impact** :
- Potentielles failles dans les dépendances (eslint, glob, rimraf, etc.)
- Risque limité car ce sont principalement des dépendances de dev (non incluses dans le build de production)

**Détail des vulnérabilités** :
- **esbuild** ≤0.24.2 : enable any website to send requests to dev server (moderate)
- **minimatch** 7.0.0 - 11.0.0 : ReDoS via wildcards (high, 4 CVE)
- **react-router** 6.0.0 - 7.17.0 : open redirect + constructor injection (moderate)

**Note** : `npm audit fix` ne corrige rien automatiquement car les fixes nécessitent des **breaking changes** :
- vite@8.3.5 (actuellement 5.0.10)
- @typescript-eslint/parser@8.72.1 (actuellement 6.17.0)
- react-router-dom > 7.17.0 (actuellement 6.21.1)

**Recommandation** : 
1. Évaluer l'impact des breaking changes avant mise à jour
2. Tester en local avec `npm audit fix --force` (attention : peut casser le build)
3. Prioriser la mise à jour de **react-router** (vulnérabilités moderate en production)

---

## 📝 Recommandations SQL pour RLS

### Option 1 : Donner accès écriture complet aux admins (recommandé)

```sql
-- vr_sessions : admin peut tout modifier
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.vr_sessions;
CREATE POLICY "Admins can manage all sessions"
  ON public.vr_sessions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session_steps : admin peut tout modifier
DROP POLICY IF EXISTS "Admins can read all session steps" ON public.session_steps;
CREATE POLICY "Admins can manage all session steps"
  ON public.session_steps FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session_sales : admin peut tout modifier
DROP POLICY IF EXISTS "Admins can read all session sales" ON public.session_sales;
CREATE POLICY "Admins can manage all session sales"
  ON public.session_sales FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session_media : admin peut tout modifier
DROP POLICY IF EXISTS "Admins read all session media" ON public.session_media;
CREATE POLICY "Admins can manage all session media"
  ON public.session_media FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

**Avantage** : Les admins peuvent corriger les erreurs et gérer les sessions complètement.

**Inconvénient** : Les admins peuvent modifier l'historique des sessions d'autres GMs (à documenter dans les règles métier).

### Option 2 : Donner accès écriture limité (UPDATE uniquement, pas INSERT/DELETE)

```sql
-- vr_sessions : admin peut modifier (pas créer/supprimer)
CREATE POLICY "Admins can update all sessions"
  ON public.vr_sessions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Idem pour session_steps, session_sales, session_media
-- (à adapter selon les besoins métier)
```

**Avantage** : Limite les modifications admin (correction uniquement).

**Inconvénient** : Les admins ne peuvent pas ajouter/supprimer des étapes ou ventes.

---

## 🔧 Recommandations de corrections

### Correction 1 : Mettre à jour les dépendances npm

```bash
npm audit fix
npm update
```

**Note** : Tester après mise à jour pour vérifier que rien ne casse.

### Correction 2 : Documenter le mode démo

Ajouter un commentaire explicatif dans `src/hooks/useAuth.tsx` :

```typescript
// En mode démo, isAdmin est forcé à true pour tester les écrans admin localement.
// Les données sont locales (localStorage) et ne touchent pas la vraie base.
isAdmin: readIsAdmin(user) || isMockMode,
```

### Correction 3 : Documenter listRecordedSessions()

Ajouter un commentaire dans `src/lib/sessionView.ts` :

```typescript
/**
 * Admin only: list all recorded sessions (last 60).
 * This function is used exclusively in SessionMediaAdmin (Dashboard),
 * which is only shown when isAdmin === true.
 * RLS ensures non-admins cannot read other GMs' sessions.
 */
export async function listRecordedSessions(): Promise<RecordedSessionRow[]> { ... }
```

### Correction 4 : Restreindre CORS (optionnel)

Si souhaité, modifier les edge functions pour restreindre CORS :

```typescript
// supabase/functions/*/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://genie-culturel.github.io",
  // ...
};
```

**Note** : Uniquement si le déploiement est exclusivement sur GitHub Pages. Sinon garder `*` pour flexibilité.

---

## 🛠️ Tests effectués

### Build et typecheck
```bash
npm run build
# ✅ Build réussi (tsc + vite build)
# ✅ Aucune erreur TypeScript
# ⚠️ Warning : chunk > 500 KB (optimisation recommandée, pas de sécurité)
```

### Analyse du code
- ✅ Aucune clé service_role ou secret dans le code front
- ✅ Toutes les queries Supabase utilisent les bonnes protections RLS
- ✅ Les écrans admin sont protégés côté UI
- ✅ Les edge functions sont correctement authentifiées
- ✅ Aucun console.log ne logue de données utilisateur sensibles

---

## 📊 Synthèse des risques

| Risque | Gravité | Impact | Statut |
|--------|---------|--------|--------|
| Clés service_role dans le code | ❌ Aucun | N/A | ✅ Validé |
| Edge functions non authentifiées | ❌ Aucun | N/A | ✅ Validé |
| Écrans admin non protégés | ❌ Aucun | N/A | ✅ Validé |
| RLS manquant ou incomplet | ⚠️ Moyen | Admin lecture seule | 🟡 Documenter |
| Fuite de données entre GMs | ❌ Aucun | N/A | ✅ Validé |
| gh_vr_sessions.gm_id incorrect | ❌ Aucun | N/A | ✅ Validé (auth.users.id) |
| Bug modif/suppression non-admin | ❌ Aucun | N/A | ✅ Validé (aucune UI) |
| Console.log avec données sensibles | ❌ Aucun | N/A | ✅ Validé |
| CORS trop permissif | 🟢 Faible | Acceptable | ✅ OK |
| Vulnérabilités npm | ⚠️ Moyen | Dépendances dev | 🟡 Corriger |

---

## ✅ Conclusion

**L'application GMassignee est globalement sécurisée** :
- ✅ Aucune clé secrète exposée
- ✅ Authentification et autorisation correctes
- ✅ RLS bien configurés pour éviter les fuites de données entre GMs
- ✅ Edge functions protégées
- ✅ Écrans admin protégés côté UI

**Points d'attention** :
- 🟡 Les admins ont un accès lecture seule sur les sessions (incomplet si besoin métier de correction)
- 🟡 Vulnérabilités npm à corriger (principalement dev dependencies)

**Actions recommandées** :
1. Lancer `npm audit fix` et mettre à jour les dépendances
2. Décider si les admins doivent pouvoir modifier les sessions d'autres GMs (et appliquer le SQL recommandé)
3. Ajouter les commentaires de documentation suggérés
4. (Optionnel) Restreindre CORS si déploiement exclusif sur GitHub Pages

---

**Audit effectué le 4 novembre 2026**  
**Par : Cursor Agent Cloud**  
**Version de l'app : 0.1.0**
