-- Per-location session parcours (Julien, 2026-11-03).
-- * session_steps.step / session_step_fiches.step become text (existing VR keys unchanged).
-- * parcours (one per location) + parcours_steps (editable by admins).
-- * vr_sessions.steps_snapshot keeps the steps a session was started with.

ALTER TABLE public.session_steps ALTER COLUMN step TYPE text USING step::text;
ALTER TABLE public.session_step_fiches ALTER COLUMN step TYPE text USING step::text;

ALTER TABLE public.vr_sessions
  ADD COLUMN IF NOT EXISTS steps_snapshot jsonb;
COMMENT ON COLUMN public.vr_sessions.steps_snapshot IS
  'Steps of the parcours when the session started: [{key,label,hint,note}]. Null = legacy session (uses current parcours).';
COMMENT ON COLUMN public.vr_sessions.parcours_id IS
  'public.parcours.id (vr_centre_client, escape_life_sion, escape_life_sierre, chandoline).';

CREATE TABLE IF NOT EXISTS public.parcours (
  id text PRIMARY KEY,
  location_id uuid NOT NULL UNIQUE REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_provisional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parcours_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcours_id text NOT NULL REFERENCES public.parcours(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  label text NOT NULL,
  hint text,
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parcours_id, step_key)
);
COMMENT ON COLUMN public.parcours_steps.step_key IS
  'Stable key stored in session_steps.step. VR keys are the historical enum values.';
COMMENT ON COLUMN public.parcours_steps.note IS
  'Free-text condition shown as a badge, e.g. « Option Vinum ».';

CREATE INDEX IF NOT EXISTS idx_parcours_steps_parcours ON public.parcours_steps (parcours_id, sort_order);

ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcours_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read parcours" ON public.parcours;
CREATE POLICY "Authenticated read parcours" ON public.parcours
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage parcours" ON public.parcours;
CREATE POLICY "Admins manage parcours" ON public.parcours
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read parcours_steps" ON public.parcours_steps;
CREATE POLICY "Authenticated read parcours_steps" ON public.parcours_steps
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage parcours_steps" ON public.parcours_steps;
CREATE POLICY "Admins manage parcours_steps" ON public.parcours_steps
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcours, public.parcours_steps TO authenticated;

INSERT INTO public.parcours (id, location_id, name, description, is_provisional)
SELECT v.id, l.id, v.name, v.description, v.provisional
FROM public.locations l
JOIN (VALUES
  ('vr_centre_client', 'vr_center', 'Parcours client VR au centre', 'Accueil, jeu et débriefing au VR Center', false),
  ('escape_life_sion', 'escape_sion', 'Parcours Escape Life Sion', 'Da Vinci Code : préparation, animation et rangement', false),
  ('escape_life_sierre', 'escape_sierre', 'Parcours Escape Life Sierre', 'Le Feu sacré, version 1 équipe', false),
  ('chandoline', 'chandoline', 'Parcours Usine de Chandoline', 'Novasphère : parcours provisoire, à confirmer', true)
) AS v(id, location_slug, name, description, provisional) ON v.location_slug = l.slug
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.parcours_steps (parcours_id, step_key, label, hint, note, sort_order)
SELECT v.parcours_id, v.step_key, v.label, v.hint, v.note, v.sort_order
FROM (VALUES
  -- A. Virtual Reality Center (17)
  ('vr_centre_client', 'reception_seating', 'Installation au lobby', 'Accueillir le groupe et l''installer : 1er groupe au salon, 2e au bar (accueil plein → salon).', NULL, 10),
  ('vr_centre_client', 'reception_drinks', 'Boissons', 'Proposer les boissons du frigo. Paiement par Twint, ou facture pour les entreprises.', NULL, 20),
  ('vr_centre_client', 'reception_popcorn', 'Pop-corn', 'Offrir le pop-corn, lancé pendant la préparation.', NULL, 30),
  ('vr_centre_client', 'reception_checkin', 'Check-in QR', 'Chaque client scanne le QR « CHECK IN » (consentement individuel aux CG). Annoncer le tournage des vidéos.', NULL, 40),
  ('vr_centre_client', 'game_intro', 'Présentation du jeu', 'Déjà fait de la VR ? Home-made, innovation, zéro nausée, coopération, Sion au XVe et pitch du jeu.', NULL, 50),
  ('vr_centre_client', 'salon_briefing', 'Briefing sécurité', 'Consignes de sécurité au salon (TV) : « les 10 commandements de la VR ».', NULL, 60),
  ('vr_centre_client', 'salon_lockers', 'Casiers', 'Vestes, pulls, sacs et appareils électroniques dans les casiers. S''habiller léger.', NULL, 70),
  ('vr_centre_client', 'hall_equipment', 'Équipement en halle', 'Amener le groupe en halle de jeu et l''équiper (Meta Quest 3, manettes).', NULL, 80),
  ('vr_centre_client', 'game_playing', 'Jeu en cours', 'Animer la partie. Saga : pause pop-corn de 15 min entre les 2 chapitres.', NULL, 90),
  ('vr_centre_client', 'game_filming', 'Filmer moments clés', 'Filmer les moments forts. Partie et équipe cool → prévenir Luna (story).', NULL, 100),
  ('vr_centre_client', 'hall_unequip', 'Déséquipement', 'Retirer casques et manettes aux clients.', NULL, 110),
  ('vr_centre_client', 'salon_return', 'Retour salon', 'Repasser par le salon pour reprendre ses affaires dans les casiers.', NULL, 120),
  ('vr_centre_client', 'reception_debrief', 'Débriefing', 'Débriefer : 1er groupe sorti au salon, 2e au bar. Proposer le chapitre II après le I.', NULL, 130),
  ('vr_centre_client', 'videos_sent', 'Prise et envoi vidéos', 'Filmer 2 courtes vidéos du groupe en jeu, puis les envoyer au client par e-mail (supprimées après 14 jours). Le groupe en est informé au check-in.', NULL, 140),
  ('vr_centre_client', 'google_review', 'Avis Google', 'Inviter à laisser un avis Google (affiche avec QR code).', NULL, 150),
  ('vr_centre_client', 'socials_shared', 'Réseaux sociaux', 'S''abonner, partager les vidéos en nous taguant (affiches QR). Story avec Luna si présente.', NULL, 160),
  ('vr_centre_client', 'cleaning', 'Nettoyage casques', 'Nettoyer casques et manettes, contrôle rapide, prêt pour le groupe suivant.', NULL, 170),
  -- B. Escape Life Sion (16)
  ('escape_life_sion', 'sion_booking_info', 'Infos de la réservation', 'La veille au plus tard, dans GMassignee : nombre de joueurs, option « 1 équipe », langue, options, notes admin.', NULL, 10),
  ('escape_life_sion', 'sion_stock_arrival', 'Arrivée au stock', 'Être au lieu de stockage 45 min à 1 h avant l''heure de la réservation.', NULL, 20),
  ('escape_life_sion', 'sion_game_material', 'Matériel du jeu', 'Éléments dans la langue du client, 1 sac par équipe, téléphone d''animation, clés.', NULL, 30),
  ('escape_life_sion', 'sion_vinum_material', 'Matériel Vinum', 'Verres, bouteilles, cadenas, porte-verres, tire-bouchons. Respecter les quantités.', 'Option Vinum', 40),
  ('escape_life_sion', 'sion_prepare_stages', 'Préparer les étapes', 'Sac client à la 1re étape, lumière, éléments, cadenas verrouillés, appareils branchés et testés.', NULL, 50),
  ('escape_life_sion', 'sion_couvent_start', 'Mise en route Couvent', 'Brancher, beamer allumé tout de suite, capteurs verts, ARM, test PIR, RESET, escalier, ARM.', NULL, 60),
  ('escape_life_sion', 'sion_meeting_point', 'Accueil au rendez-vous', 'Rendez-vous au lieu de préparation (provisoire). Accueillir le groupe et briefer les équipes.', NULL, 70),
  ('escape_life_sion', 'sion_animation', 'Animation 4DGames', 'Animer sur 4dgames.ch avec le téléphone d''animation. Indices subtils, ne pas dépasser la durée max.', NULL, 80),
  ('escape_life_sion', 'sion_team_tracking', 'Suivi des équipes', 'Contact perdu → « Localiser » le sac de l''équipe, sinon appeler un responsable.', NULL, 90),
  ('escape_life_sion', 'sion_end_script', 'Script de fin', 'Expliquer le Chrisme et l''acte de contrition (Schiner contre Supersaxo), plus les fun facts.', NULL, 100),
  ('escape_life_sion', 'sion_google_review', 'Avis Google', 'Inviter à laisser un avis Google, sauf si les clients n''ont pas apprécié.', NULL, 110),
  ('escape_life_sion', 'sion_collect_material', 'Récupérer le matériel', 'Reprendre tous les éléments de jeu auprès des joueurs.', NULL, 120),
  ('escape_life_sion', 'sion_tidy_rooms', 'Ranger les salles', 'Remettre en état, déchets, dégâts, cadenas ouverts dans les boîtes, éteindre, débrancher, fermer à clé.', NULL, 130),
  ('escape_life_sion', 'sion_couvent_stop', 'Arrêt Couvent', 'Beamer éteint (2 pressions), attendre l''extinction, débrancher la prise derrière l''harmonium.', NULL, 140),
  ('escape_life_sion', 'sion_vinum_glasses', 'Vinum : verres et vins', 'Bouteilles jetées en chemin (sauf 21 h–7 h et 12 h–13 h → bac de la cave). Séparer verres sales et propres.', 'Option Vinum', 150),
  ('escape_life_sion', 'sion_stock_return', 'Retour au stock', 'Matériel à sa place (étiquettes), sacs vidés, téléphone et batteries en charge, défauts signalés.', NULL, 160),
  -- C. Escape Life Sierre, 1 équipe (14)
  ('escape_life_sierre', 'sierre_booking_info', 'Infos de la réservation', 'La veille : nombre de joueurs et d''équipes, langue, options, notes admin.', NULL, 10),
  ('escape_life_sierre', 'sierre_stock_arrival', 'Arrivée au stock', 'Être au lieu de stockage 45 min à 1 h avant la réservation.', NULL, 20),
  ('escape_life_sierre', 'sierre_game_material', 'Matériel du jeu', 'Éléments dans la bonne langue, 1 sac par équipe, téléphone d''animation, clés (+ vin si option).', NULL, 30),
  ('escape_life_sierre', 'sierre_prepare_cave', 'Préparer Cave des Vidômes', 'Sac client, lumière, éléments, cadenas verrouillés, appareils branchés et testés.', NULL, 40),
  ('escape_life_sierre', 'sierre_prepare_villa', 'Préparer Château Villa', 'Même préparation qu''à la Cave.', NULL, 50),
  ('escape_life_sierre', 'sierre_meeting_point', 'Accueil au rendez-vous', 'Rue du Bourg 24, devant le Château des Vidômes.', NULL, 60),
  ('escape_life_sierre', 'sierre_game_start', 'Début du jeu', 'Lancer l''animation sur 4dgames.ch (téléphone). Cave 60 min, NDDM 10, Mercier 40, Villa 20.', NULL, 70),
  ('escape_life_sierre', 'sierre_team_tracking', 'Suivi des équipes', 'Indices subtils, durée max. Contact perdu → « Localiser » le sac, sinon appeler un responsable.', NULL, 80),
  ('escape_life_sierre', 'sierre_tidy_cave', 'Ranger Cave des Vidômes', 'Après le passage de l''équipe : remise en état, cadenas ouverts, éteindre, débrancher, fermer.', NULL, 90),
  ('escape_life_sierre', 'sierre_final_villa', 'Final au Château Villa', 'Faire la fin du jeu à la Villa.', NULL, 100),
  ('escape_life_sierre', 'sierre_google_review', 'Avis Google', 'Inviter à laisser un avis Google, sauf si les clients n''ont pas apprécié.', NULL, 110),
  ('escape_life_sierre', 'sierre_tidy_villa', 'Ranger Château Villa', 'Remise en état, déchets, cadenas ouverts, éteindre, débrancher, fermer à clé.', NULL, 120),
  ('escape_life_sierre', 'sierre_medallions', 'Ramener les médaillons', 'Rapporter les médaillons à la Cave des Vidômes.', NULL, 130),
  ('escape_life_sierre', 'sierre_stock_return', 'Retour au stock', 'Matériel à sa place, sacs vidés, téléphone et batteries en charge, défauts signalés.', NULL, 140),
  -- D. Usine de Chandoline, Novasphère (11, provisoire)
  ('chandoline', 'nova_site_prep', 'Préparation sur site', 'Arriver en avance, ouvrir, allumer et tester l''installation XR.', 'À confirmer', 10),
  ('chandoline', 'nova_welcome', 'Accueil du groupe', 'Accueillir le groupe à l''usine (rue de la Dixence 76, Sion).', 'À confirmer', 20),
  ('chandoline', 'nova_checkin', 'Check-in QR', 'Consentement individuel aux CG. Annoncer le tournage des vidéos.', 'À confirmer', 30),
  ('chandoline', 'nova_safety', 'Briefing sécurité', 'Consignes de sécurité propres à une usine réelle (zones, commandes).', 'À confirmer', 40),
  ('chandoline', 'nova_equipment', 'Équipement', 'Équiper les joueurs (casques XR).', 'À confirmer', 50),
  ('chandoline', 'nova_playing', 'Jeu en cours', 'Animer la mission (45 min).', 'À confirmer', 60),
  ('chandoline', 'videos_sent', 'Prise et envoi vidéos', 'Filmer 2 vidéos et les envoyer par e-mail via l''app.', 'À confirmer', 70),
  ('chandoline', 'nova_debrief', 'Débriefing', 'Débriefer le groupe.', 'À confirmer', 80),
  ('chandoline', 'nova_google_review', 'Avis Google', 'Inviter à laisser un avis Google.', 'À confirmer', 90),
  ('chandoline', 'nova_socials', 'Réseaux sociaux', 'Inviter à suivre et à taguer nos réseaux.', 'À confirmer', 100),
  ('chandoline', 'nova_closing', 'Rangement et extinction', 'Nettoyer le matériel, éteindre l''installation, fermer.', 'À confirmer', 110)
) AS v(parcours_id, step_key, label, hint, note, sort_order)
WHERE EXISTS (SELECT 1 FROM public.parcours p WHERE p.id = v.parcours_id)
ON CONFLICT (parcours_id, step_key) DO NOTHING;
