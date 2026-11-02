-- Seed procedure fiches with real content from documents
-- Placeholders (🚧 à compléter) for missing Quest 3 procedures

-- Equipment setup fiches
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'equipment_setup',
  '🚧 Configuration casques Quest 3',
  'Procédure complète de mise en route des casques Meta Quest 3 (à compléter par Julien)',
  '[
    {"order": 1, "text": "🚧 Allumage des casques (procédure à documenter)"},
    {"order": 2, "text": "🚧 Lancement du programme de jeu (procédure à documenter)"},
    {"order": 3, "text": "🚧 Configuration Guardian et zone de jeu (procédure à documenter)"},
    {"order": 4, "text": "🚧 Sélection des avatars et tuto (procédure à documenter)"}
  ]'::jsonb,
  true,
  ARRAY['Quest 3', 'matériel', 'casques']
),
(
  'equipment_setup',
  '🚧 Recharge des casques et manettes',
  'Comment recharger les casques Quest 3 et les manettes entre deux groupes (à compléter)',
  '[
    {"order": 1, "text": "🚧 Procédure de recharge (à documenter)"},
    {"order": 2, "text": "🚧 Vérification du niveau de batterie (à documenter)"},
    {"order": 3, "text": "🚧 Temps de recharge nécessaire (à documenter)"}
  ]'::jsonb,
  true,
  ARRAY['Quest 3', 'matériel', 'recharge']
);

-- Game launch fiches
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'game_launch',
  '🚧 Lancement du Serviteur I',
  'Comment lancer le jeu Le Serviteur de la Rédemption - Chapitre I (à compléter)',
  '[
    {"order": 1, "text": "🚧 Procédure de lancement (à documenter)"},
    {"order": 2, "text": "Durée : 40-50 min de VR, prévoir 1h30 sur place"},
    {"order": 3, "text": "2 à 16 joueurs (8 max par halle)"}
  ]'::jsonb,
  true,
  ARRAY['Serviteur', 'jeu', 'lancement']
),
(
  'game_launch',
  '🚧 Lancement de la Planta',
  'Comment lancer le jeu La Bataille de la Planta (à compléter)',
  '[
    {"order": 1, "text": "🚧 Procédure de lancement (à documenter)"},
    {"order": 2, "text": "Durée : 45 min de jeu, prévoir 1h30 sur place"},
    {"order": 3, "text": "2 à 16 joueurs (8 max par halle)"}
  ]'::jsonb,
  true,
  ARRAY['Planta', 'jeu', 'lancement']
),
(
  'game_launch',
  '🚧 Lancement de la Saga (2 chapitres)',
  'Comment lancer la Saga complète avec pause pop-corn entre les chapitres (à compléter)',
  '[
    {"order": 1, "text": "🚧 Lancement chapitre I (à documenter)"},
    {"order": 2, "text": "Pause pop-corn de 15 min entre les chapitres"},
    {"order": 3, "text": "🚧 Lancement chapitre II (à documenter)"},
    {"order": 4, "text": "Durée totale : 1h30 de VR, prévoir 2h sur place"}
  ]'::jsonb,
  true,
  ARRAY['Saga', 'Serviteur', 'jeu', 'lancement']
);

-- Troubleshooting fiches
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'troubleshooting',
  '🚧 Dépannage : Bug ou freeze en jeu',
  'Que faire quand le jeu bug, freeze ou ne répond plus (à compléter)',
  '[
    {"order": 1, "text": "🚧 Diagnostic du problème (à documenter)"},
    {"order": 2, "text": "🚧 Redémarrage du jeu sans perdre la progression (à documenter)"},
    {"order": 3, "text": "🚧 Quand contacter l''admin (à documenter)"}
  ]'::jsonb,
  true,
  ARRAY['bug', 'dépannage', 'incident']
),
(
  'troubleshooting',
  'Dépannage : Malaise client',
  'Que faire si un client se sent mal (nausée, vertige, malaise)',
  '[
    {"order": 1, "text": "Retirer immédiatement le casque du client"},
    {"order": 2, "text": "L''accompagner s''asseoir dans un endroit calme"},
    {"order": 3, "text": "Lui proposer de l''eau"},
    {"order": 4, "text": "Attendre que le client se sente mieux avant de reprendre"},
    {"order": 5, "text": "Si le malaise persiste, arrêter la session et contacter un responsable"},
    {"order": 6, "text": "Noter l''incident dans la session"}
  ]'::jsonb,
  false,
  ARRAY['malaise', 'sécurité', 'incident']
),
(
  'troubleshooting',
  '🚧 Dépannage : Tracking perdu',
  'Que faire quand le tracking des casques ou manettes est perdu (à compléter)',
  '[
    {"order": 1, "text": "🚧 Vérification de l''éclairage de la halle (à documenter)"},
    {"order": 2, "text": "🚧 Recalibrage du guardian (à documenter)"},
    {"order": 3, "text": "🚧 Redémarrage des casques si nécessaire (à documenter)"}
  ]'::jsonb,
  true,
  ARRAY['tracking', 'dépannage', 'incident']
),
(
  'troubleshooting',
  '🚧 Dépannage : Manette ou casque cassé',
  'Que faire en cas de matériel cassé (à compléter)',
  '[
    {"order": 1, "text": "Mettre le matériel de côté avec une étiquette"},
    {"order": 2, "text": "Noter précisément ce qui est cassé"},
    {"order": 3, "text": "🚧 Contacter l''admin immédiatement (procédure à documenter)"},
    {"order": 4, "text": "🚧 Utiliser le matériel de secours si disponible (à documenter)"}
  ]'::jsonb,
  true,
  ARRAY['casse', 'matériel', 'incident']
);

-- Cleaning fiches
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'cleaning',
  'Nettoyage casques et manettes entre groupes',
  'Nettoyage rapide entre deux groupes (obligatoire)',
  '[
    {"order": 1, "text": "🚧 Produit et chiffon à utiliser (à documenter)"},
    {"order": 2, "text": "Nettoyer les mousses de contact des casques"},
    {"order": 3, "text": "Nettoyer les poignées des manettes"},
    {"order": 4, "text": "Vérifier visuellement l''état du matériel"},
    {"order": 5, "text": "🚧 Temps nécessaire : environ X min (à préciser)"}
  ]'::jsonb,
  true,
  ARRAY['nettoyage', 'hygiène', 'matériel']
);

-- Client experience fiches
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'client_experience',
  'Check-in QR et consentement',
  'Comment faire scanner le QR code de check-in et expliquer le consentement aux CG',
  '[
    {"order": 1, "text": "Demander à chaque client de scanner le QR code CHECK IN avec son téléphone"},
    {"order": 2, "text": "Préciser qu''il s''agit d''un consentement INDIVIDUEL aux conditions générales"},
    {"order": 3, "text": "S''assurer que chaque personne a bien scanné (un scan par personne)"},
    {"order": 4, "text": "Répondre aux questions sur les CG si nécessaire"}
  ]'::jsonb,
  false,
  ARRAY['accueil', 'check-in', 'CG']
),
(
  'client_experience',
  'Briefing sécurité au salon',
  'Les points de sécurité à présenter avant le jeu',
  '[
    {"order": 1, "text": "Demander si les clients ont déjà fait de la VR"},
    {"order": 2, "text": "Expliquer : zéro nausée, zéro désagrément grâce à notre technologie"},
    {"order": 3, "text": "Zone de jeu : respecter les limites du Guardian"},
    {"order": 4, "text": "En cas de malaise : lever la main, on retire le casque immédiatement"},
    {"order": 5, "text": "Interaction et coopération : vous vous voyez et pouvez échanger des objets"},
    {"order": 6, "text": "🚧 Les « 10 commandements de la VR » (à documenter en détail)"}
  ]'::jsonb,
  true,
  ARRAY['sécurité', 'briefing', 'accueil']
),
(
  'client_experience',
  'Pitch du studio et des jeux',
  'Comment présenter le Virtual Reality Center et les jeux aux clients',
  '[
    {"order": 1, "text": "Tout est fait maison à Sion : recherche historique, 3D, voix d''acteurs valaisans"},
    {"order": 2, "text": "2 halles de 160 m² en free roam multijoueur"},
    {"order": 3, "text": "Conception home-made avec innovations techniques"},
    {"order": 4, "text": "Sion au XVe siècle : manuscrit des 6 âges, bataille de la Planta"},
    {"order": 5, "text": "Adapter ton pitch au jeu choisi et au profil du groupe"}
  ]'::jsonb,
  false,
  ARRAY['accueil', 'pitch', 'présentation']
),
(
  'client_experience',
  'Envoi des vidéos et réseaux sociaux',
  'Comment partager les vidéos et encourager les avis',
  '[
    {"order": 1, "text": "Envoyer les vidéos du jeu idéalement par AirDrop"},
    {"order": 2, "text": "🚧 Si Lunaël est présente : la voir AVANT la fin du jeu pour proposer une story (à confirmer si toujours d''actualité)"},
    {"order": 3, "text": "Inviter les clients à s''abonner à nos réseaux sociaux"},
    {"order": 4, "text": "Leur demander de partager en nous taguant (montrer les affiches avec QR codes)"},
    {"order": 5, "text": "Encourager à laisser un avis Google (affiche avec QR code)"}
  ]'::jsonb,
  true,
  ARRAY['réseaux', 'vidéos', 'avis', 'débriefing']
);

-- Safety fiche
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'safety',
  '🚧 Contre-indications et règles de sécurité',
  'Qui ne peut pas jouer et règles de sécurité générales (à compléter)',
  '[
    {"order": 1, "text": "Âge minimum : 9 ans (Serviteur, Planta), 10 ans (Saga, SchoolCrafter)"},
    {"order": 2, "text": "🚧 Contre-indications médicales : épilepsie, grossesse, etc. (à documenter précisément)"},
    {"order": 3, "text": "S''habiller léger : vestes et pulls aux casiers"},
    {"order": 4, "text": "Pas d''appareils électroniques en jeu : tout aux casiers"},
    {"order": 5, "text": "🚧 Autres règles de sécurité (à compléter)"}
  ]'::jsonb,
  true,
  ARRAY['sécurité', 'contre-indications', 'règles']
);

-- Now link fiches to session steps
INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'reception_checkin', id FROM procedure_fiches WHERE title = 'Check-in QR et consentement';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'salon_briefing', id FROM procedure_fiches WHERE title = 'Briefing sécurité au salon';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'salon_briefing', id FROM procedure_fiches WHERE title = '🚧 Contre-indications et règles de sécurité';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'game_playing', id FROM procedure_fiches WHERE title LIKE '%Lancement du Serviteur%';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'game_playing', id FROM procedure_fiches WHERE title LIKE '%Lancement de la Planta%';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'game_playing', id FROM procedure_fiches WHERE title LIKE '%Lancement de la Saga%';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'reception_debrief', id FROM procedure_fiches WHERE title = 'Pitch du studio et des jeux';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'videos_sent', id FROM procedure_fiches WHERE title = 'Envoi des vidéos et réseaux sociaux';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'google_review', id FROM procedure_fiches WHERE title = 'Envoi des vidéos et réseaux sociaux';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'socials_shared', id FROM procedure_fiches WHERE title = 'Envoi des vidéos et réseaux sociaux';

INSERT INTO session_step_fiches (step, fiche_id) 
SELECT 'cleaning', id FROM procedure_fiches WHERE title = 'Nettoyage casques et manettes entre groupes';
