# Guide de test rapide - Module Procédures VR

Ce guide te permet de tester le nouveau module en 5 minutes.

## 🚀 Démarrage rapide (mode démo)

```bash
# 1. Clone la branche
git checkout cursor/vr-procedures-module-783d

# 2. Installe les dépendances
npm install

# 3. Lance l'app
npm run dev
```

Ouvre http://localhost:8080 dans ton navigateur (ou téléphone).

## ✅ Scénario de test 1 : Dashboard

1. **Vérifie l'alert jaune** en haut : « Mode démo actif »
2. **Lis les 4 cards métriques** : Sessions, Check-ins, Checklists, Fiches
3. **Lis la présentation du module** dans la grande card en bas

**Attendu** : tout s'affiche correctement, aucune erreur console.

## ✅ Scénario de test 2 : Formations & Procédures

1. **Clique sur l'onglet "Formations"** (icône livre)
2. **Vérifie le titre** « Formations & Procédures » et les 3 onglets : Formation technique, Procédure et déroulement, Dépannage & bugs
3. **Vérifie les badges** : certaines fiches ont un badge jaune « 🚧 À compléter »
4. **Clique sur une fiche** (ex: "Dépannage : Malaise client")
5. **Le drawer s'ouvre à droite** avec le détail de la fiche (étapes numérotées)
6. **Ferme le drawer** (X en haut à droite ou clic dehors)
7. **Recherche "malaise"** dans la barre de recherche
8. **Vérifie** que la fiche correspondante apparaît

**Attendu** : 
- 8 fiches réparties dans les catégories
- Les fiches avec 🚧 affichent un badge jaune
- Le drawer s'ouvre et se ferme proprement
- La recherche filtre les résultats

## ✅ Scénario de test 3 : Suivi des parties (le plus important)

1. **Clique sur l'onglet "Suivi parties"** (icône play)
2. **Vérifie « Mes sessions »** : parties du jour puis à venir (jeu, date/heure, groupe, joueurs)
3. **Clique une session** → elle démarre pré-remplie (en-tête, ventes, bug reporter)
4. **Ou** fallback : parcours « Parcours client VR au centre » + **Démarrer la session**
3. **Coche quelques étapes** :
   - "Installation au lobby"
   - "Check-in QR" → **clique sur « Comment faire ? »** → le drawer s'ouvre avec la fiche Check-in
   - "Briefing sécurité" → **clique sur « Comment faire ? »** → le drawer montre les consignes
   - "Jeu en cours"
4. **Signale un incident** : clique sur le bouton "Malaise client"
5. **L'alert rouge apparaît** avec un lien « Voir la procédure de dépannage »
6. **Clique sur ce lien** → le drawer s'ouvre avec la fiche « Dépannage : Malaise client »
7. **Ajoute des notes** dans le champ "Notes de session"
8. **Clique "Terminer la session"** → popup de confirmation (mode démo)

**Attendu** :
- Le workflow étape par étape fonctionne
- Le bouton "Comment faire ?" ouvre les fiches pertinentes dans le contexte
- L'incident ouvre automatiquement la bonne fiche de dépannage
- Tout reste fluide, même sur mobile

## 📱 Test mobile

Ouvre l'app sur ton téléphone (même réseau WiFi) :

```
http://[IP-de-ton-ordi]:8080
```

**Vérifie** :
- Navigation par tabs en haut
- Drawer plein écran sur mobile
- Checkboxes faciles à toucher
- Texte lisible sans zoom

## 🐛 Que faire si...

### Erreur "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 8080 déjà utilisé
Change le port dans `vite.config.ts` :
```ts
server: { port: 3000 }
```

### L'app ne charge rien
Ouvre la console navigateur (F12) et envoie les erreurs.

## ✅ Checklist validation

- [ ] Dashboard s'affiche sans erreur
- [ ] Les 3 onglets fonctionnent
- [ ] Formation : 8 fiches visibles, browse par catégorie OK
- [ ] Formation : clic sur fiche ouvre le drawer
- [ ] Formation : recherche fonctionne
- [ ] Suivi : démarrage session OK
- [ ] Suivi : cocher étapes OK
- [ ] Suivi : « Comment faire ? » ouvre les fiches
- [ ] Suivi : incident ouvre la fiche de dépannage
- [ ] Mobile : navigation fluide
- [ ] Mobile : drawer plein écran

## 📝 Retours

Note tes retours ici ou dans les commentaires du PR :

- **Ce qui marche bien** :
- **Ce qui manque** :
- **Bugs rencontrés** :
- **Suggestions** :

## 🔜 Prochaine étape

Une fois validé en mode démo, on pourra :
1. Connecter à une vraie base Supabase (voir MIGRATION_GUIDE.md)
2. Compléter les fiches 🚧 avec les vraies procédures Quest 3
3. Tester avec des GMs en conditions réelles
4. Merger dans main → déploiement Lovable

---

**Temps estimé de test** : 5-10 minutes pour le parcours complet.
