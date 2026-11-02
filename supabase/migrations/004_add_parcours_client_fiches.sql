-- Add dedicated Parcours Client fiches (one per session step)
-- Real content extracted from docs where available

-- First, add 'parcours_client' to the fiche_category enum
ALTER TYPE fiche_category ADD VALUE IF NOT EXISTS 'parcours_client';

-- Create 14 fiches for the client journey (parcours client)

-- 1. Installation au lobby (reception_seating)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Installation au lobby',
  'Comment installer les clients dans la salle d''accueil au début de leur visite',
  '[
    {"order": 1, "text": "Accueillir chaleureusement les clients dès leur arrivée"},
    {"order": 2, "text": "Les installer à une des 2 tables de 8 (ou chaises de réserve si besoin)"},
    {"order": 3, "text": "Premier groupe arrivé : au lobby. Si le salon est libre, possibilité d''y aller aussi"},
    {"order": 4, "text": "Si plusieurs groupes se croisent : le salon sert de 2e recours"},
    {"order": 5, "text": "Se présenter et présenter brièvement le centre"}
  ]'::jsonb,
  false,
  ARRAY['accueil', 'lobby', 'installation']
);

-- 2. Boissons (reception_drinks)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Proposition de boissons',
  'Comment proposer et servir les boissons aux clients',
  '[
    {"order": 1, "text": "Proposer des boissons aux clients (vente à prix sympathique)"},
    {"order": 2, "text": "Mettre de l''eau à disposition gratuitement"},
    {"order": 3, "text": "Paiement : Twint sur place ou facture pour les entreprises"},
    {"order": 4, "text": "Pour les entreprises : demander au responsable du groupe s''il souhaite une facture"},
    {"order": 5, "text": "Les boissons sont stockées dans le frigo clients (vérifier le stock avant l''ouverture)"}
  ]'::jsonb,
  false,
  ARRAY['boissons', 'vente', 'accueil']
);

-- 3. Pop-corn (reception_popcorn)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Service du pop-corn',
  'Comment servir le pop-corn offert aux clients',
  '[
    {"order": 1, "text": "Offrir du pop-corn aux clients (inclus dans le prix)"},
    {"order": 2, "text": "Le pop-corn doit être chaud : machine allumée 45 min avant, cuisson lancée 15 min avant"},
    {"order": 3, "text": "Servir généreusement : c''est à volonté"},
    {"order": 4, "text": "Créer une ambiance conviviale dès l''accueil"}
  ]'::jsonb,
  false,
  ARRAY['pop-corn', 'accueil', 'convivialité']
);

-- 4. Check-in QR (reception_checkin)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Check-in QR et consentement',
  'Comment faire scanner le QR code de check-in et expliquer le consentement aux CG',
  '[
    {"order": 1, "text": "Demander à chaque client de scanner le QR code CHECK IN avec son téléphone"},
    {"order": 2, "text": "Préciser qu''il s''agit d''un consentement INDIVIDUEL aux conditions générales"},
    {"order": 3, "text": "Insister : un scan par personne (pas un scan pour tout le groupe)"},
    {"order": 4, "text": "S''assurer que chaque personne a bien scanné avant de passer à l''étape suivante"},
    {"order": 5, "text": "Répondre aux questions sur les CG si nécessaire"}
  ]'::jsonb,
  false,
  ARRAY['check-in', 'consentement', 'CG', 'QR']
);

-- 5. Briefing sécurité (salon_briefing)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Briefing de sécurité',
  'Les points de sécurité et le pitch à présenter avant le jeu',
  '[
    {"order": 1, "text": "Demander si les clients ont déjà fait de la VR"},
    {"order": 2, "text": "Présenter : conception home-made à Sion, innovations techniques"},
    {"order": 3, "text": "Rassurer : zéro nausée, zéro désagrément grâce à notre technologie"},
    {"order": 4, "text": "Expliquer : interaction et coopération possibles (vous vous voyez, vous pouvez échanger des objets)"},
    {"order": 5, "text": "Contexte : Sion au XVe siècle, scénario selon le jeu choisi (adapter ton pitch)"},
    {"order": 6, "text": "Zone de jeu : respecter les limites du Guardian"},
    {"order": 7, "text": "En cas de malaise : lever la main, on retire le casque immédiatement"},
    {"order": 8, "text": "🚧 Les « 10 commandements de la VR » (détails à compléter)"}
  ]'::jsonb,
  true,
  ARRAY['sécurité', 'briefing', 'pitch', 'règles']
);

-- 6. Casiers (salon_lockers)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Vestiaire et casiers',
  'Comment gérer le vestiaire avant d''équiper les clients',
  '[
    {"order": 1, "text": "Demander aux clients de laisser vestes, pulls et sacs dans les casiers"},
    {"order": 2, "text": "Important : tous les appareils électroniques aux casiers (téléphones, montres, etc.)"},
    {"order": 3, "text": "Conseiller de s''habiller léger pour le confort en jeu"},
    {"order": 4, "text": "Montrer où se trouvent les casiers au salon"}
  ]'::jsonb,
  false,
  ARRAY['vestiaire', 'casiers', 'préparation']
);

-- 7. Jeu en cours (game_playing)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Animation pendant le jeu',
  'Comment animer et accompagner les clients pendant qu''ils jouent',
  '[
    {"order": 1, "text": "🚧 Équipement des casques Quest 3 : procédure à compléter (voir fiche technique dédiée)"},
    {"order": 2, "text": "🚧 Lancement du jeu choisi : voir fiches techniques par jeu"},
    {"order": 3, "text": "Rester disponible et attentif pendant le jeu"},
    {"order": 4, "text": "Observer les joueurs pour détecter tout problème (malaise, bug, etc.)"},
    {"order": 5, "text": "🚧 Donner des indices avec subtilité et bienveillance si nécessaire (à documenter)"},
    {"order": 6, "text": "En cas de bug ou malaise : intervenir immédiatement (voir fiches dépannage)"}
  ]'::jsonb,
  true,
  ARRAY['animation', 'jeu', 'accompagnement']
);

-- 8. Filmer moments clés (game_filming)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Filmer les moments clés',
  'Comment capturer les meilleurs moments du jeu',
  '[
    {"order": 1, "text": "Filmer les moments clés du jeu : actions spectaculaires, réactions, coopération"},
    {"order": 2, "text": "🚧 Équipement et réglages de capture : à documenter"},
    {"order": 3, "text": "Capturer les moments drôles ou impressionnants pour les vidéos souvenirs"},
    {"order": 4, "text": "Ces vidéos seront envoyées aux clients après le jeu"},
    {"order": 5, "text": "Si Lunaël est présente ET que le jeu s''est bien passé avec de jolies vidéos : aller la voir AVANT la fin du jeu pour qu''elle propose une story avec leur @"}
  ]'::jsonb,
  true,
  ARRAY['vidéo', 'capture', 'souvenirs']
);

-- 9. Retour salon (salon_return)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Retour au salon',
  'Comment gérer le retour des clients après le jeu',
  '[
    {"order": 1, "text": "Déséquiper les clients (retirer les casques et manettes)"},
    {"order": 2, "text": "Les accompagner au salon pour récupérer leurs affaires dans les casiers"},
    {"order": 3, "text": "Laisser un temps de descente : 5 minutes pour que les clients partagent leurs impressions entre eux"},
    {"order": 4, "text": "Ne pas intervenir tout de suite, laisser le groupe échanger sur l''expérience"},
    {"order": 5, "text": "Proposer des boissons ou de l''eau si besoin"}
  ]'::jsonb,
  false,
  ARRAY['déséquipement', 'salon', 'transition']
);

-- 10. Débriefing (reception_debrief)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Débriefing avec les clients',
  'Comment mener la discussion après le jeu',
  '[
    {"order": 1, "text": "Ouvrir la discussion : demander les impressions générales"},
    {"order": 2, "text": "Écouter les retours positifs et négatifs"},
    {"order": 3, "text": "Si il y a eu des bugs : expliquer que les jeux sont produits ici et sont en constante amélioration"},
    {"order": 4, "text": "Recueillir les suggestions d''améliorations"},
    {"order": 5, "text": "Teaser les autres jeux disponibles"},
    {"order": 6, "text": "Si possible : proposer une visite rapide des studios de production"},
    {"order": 7, "text": "Suggérer une vente à chaud : suite (chapitre 2), Saga complète, autres jeux"}
  ]'::jsonb,
  false,
  ARRAY['débriefing', 'feedback', 'discussion']
);

-- 11. Envoi des vidéos (videos_sent)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Envoi des vidéos souvenirs',
  'Comment partager les vidéos du jeu avec les clients',
  '[
    {"order": 1, "text": "Envoyer les vidéos du jeu idéalement par AirDrop (iPhone/Mac)"},
    {"order": 2, "text": "🚧 Alternative pour Android : à documenter (email, WeTransfer, autre ?)"},
    {"order": 3, "text": "S''assurer que chaque client a bien reçu ses vidéos avant de partir"},
    {"order": 4, "text": "Les clients adorent ces souvenirs : c''est un point fort de l''expérience"}
  ]'::jsonb,
  true,
  ARRAY['vidéos', 'partage', 'souvenirs']
);

-- 12. Avis Google (google_review)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Encourager les avis Google',
  'Comment demander un avis Google aux clients satisfaits',
  '[
    {"order": 1, "text": "Montrer l''affiche avec le QR code pour les avis Google"},
    {"order": 2, "text": "Encourager les clients à laisser un avis : « Si vous avez aimé l''expérience, n''hésitez pas à nous laisser 5 étoiles sur Google ! »"},
    {"order": 3, "text": "Préciser que ça nous aide beaucoup et ne prend qu''une minute"},
    {"order": 4, "text": "Ne PAS insister si les clients n''ont pas aimé l''expérience"},
    {"order": 5, "text": "L''objectif est d''avoir des avis authentiques et positifs"}
  ]'::jsonb,
  false,
  ARRAY['avis', 'Google', 'review', 'réputation']
);

-- 13. Réseaux sociaux (socials_shared)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Partage sur les réseaux sociaux',
  'Comment encourager le partage sur les réseaux sociaux',
  '[
    {"order": 1, "text": "Inviter les clients à nous suivre sur les réseaux sociaux (Instagram, Facebook, TikTok)"},
    {"order": 2, "text": "Leur demander de partager leurs vidéos en nous taguant"},
    {"order": 3, "text": "Montrer les affiches avec les QR codes des réseaux sociaux"},
    {"order": 4, "text": "Expliquer : « Plus vous partagez, plus on fait connaître l''expérience unique du VR Center ! »"},
    {"order": 5, "text": "Si Lunaël a fait une story avec eux : leur rappeler de la reposter"}
  ]'::jsonb,
  false,
  ARRAY['réseaux sociaux', 'partage', 'marketing']
);

-- 14. Nettoyage (cleaning)
INSERT INTO procedure_fiches (category, title, summary, content_steps, is_placeholder, tags) VALUES
(
  'parcours_client',
  'Nettoyage entre deux groupes',
  'Nettoyage rapide et obligatoire entre chaque groupe',
  '[
    {"order": 1, "text": "Nettoyer les casques VR : mousses de contact"},
    {"order": 2, "text": "Nettoyer les manettes : poignées"},
    {"order": 3, "text": "🚧 Produits et chiffons à utiliser : à documenter"},
    {"order": 4, "text": "Vérifier visuellement l''état du matériel (pas de casse)"},
    {"order": 5, "text": "🚧 Temps nécessaire : environ X minutes (à préciser)"},
    {"order": 6, "text": "Contrôle rapide : tout est en ordre pour le groupe suivant"},
    {"order": 7, "text": "Remettre en ordre le lobby et le salon si besoin"}
  ]'::jsonb,
  true,
  ARRAY['nettoyage', 'hygiène', 'entretien', 'entre-groupes']
);

-- Now link each session step to its dedicated fiche
-- Clear existing links first for these steps
DELETE FROM session_step_fiches WHERE step IN (
  'reception_seating', 'reception_drinks', 'reception_popcorn', 'reception_checkin',
  'salon_briefing', 'salon_lockers', 'game_playing', 'game_filming',
  'salon_return', 'reception_debrief', 'videos_sent', 'google_review',
  'socials_shared', 'cleaning'
);

-- Link each step to its dedicated fiche (1:1 mapping)
INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'reception_seating', id FROM procedure_fiches WHERE title = 'Installation au lobby' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'reception_drinks', id FROM procedure_fiches WHERE title = 'Proposition de boissons' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'reception_popcorn', id FROM procedure_fiches WHERE title = 'Service du pop-corn' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'reception_checkin', id FROM procedure_fiches WHERE title = 'Check-in QR et consentement' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'salon_briefing', id FROM procedure_fiches WHERE title = 'Briefing de sécurité' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'salon_lockers', id FROM procedure_fiches WHERE title = 'Vestiaire et casiers' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'game_playing', id FROM procedure_fiches WHERE title = 'Animation pendant le jeu' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'game_filming', id FROM procedure_fiches WHERE title = 'Filmer les moments clés' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'salon_return', id FROM procedure_fiches WHERE title = 'Retour au salon' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'reception_debrief', id FROM procedure_fiches WHERE title = 'Débriefing avec les clients' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'videos_sent', id FROM procedure_fiches WHERE title = 'Envoi des vidéos souvenirs' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'google_review', id FROM procedure_fiches WHERE title = 'Encourager les avis Google' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'socials_shared', id FROM procedure_fiches WHERE title = 'Partage sur les réseaux sociaux' AND category = 'parcours_client';

INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'cleaning', id FROM procedure_fiches WHERE title = 'Nettoyage entre deux groupes' AND category = 'parcours_client';

-- Add secondary links to technical fiches where relevant
-- game_playing can also link to Quest 3 setup and game launch fiches
INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'game_playing', id FROM procedure_fiches 
WHERE title LIKE '%Configuration casques Quest 3%' OR title LIKE '%Lancement%'
ON CONFLICT DO NOTHING;

-- salon_briefing can link to security/safety fiche
INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'salon_briefing', id FROM procedure_fiches 
WHERE title LIKE '%Contre-indications%' OR category = 'safety'
ON CONFLICT DO NOTHING;

-- cleaning links to cleaning category fiches
INSERT INTO session_step_fiches (step, fiche_id)
SELECT 'cleaning', id FROM procedure_fiches 
WHERE category = 'cleaning' AND title != 'Nettoyage entre deux groupes'
ON CONFLICT DO NOTHING;
