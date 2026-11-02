-- Seed checklist templates with real VR Center procedures
-- Based on the documents: Cahier des charges VR and Plan de nettoyage

-- Opening checklist (avant l'arrivée des clients)
INSERT INTO checklist_templates (type, title, description, order_index) VALUES
('opening', 'Allumer toutes les lumières', 'Y compris celle du réfrigérateur des boissons clients', 1),
('opening', 'Mettre en marche la machine à pop-corn', 'La laisser chauffer avant de lancer la cuisson', 2),
('opening', 'Allumer les équipements de jeu', 'Casques Quest 3, lancement des programmes', 3),
('opening', 'Vérifier les stocks de boissons', 'Dans le réfrigérateur clients', 4),
('opening', 'Vérifier papier toilette et essuie-mains', 'Dans les WC, remplir si nécessaire', 5),
('opening', 'Contrôler propreté et rangement', 'Espaces d''accueil (lobby et salon)', 6),
('opening', 'Lancer la cuisson des pop-corn', NULL, 7),
('opening', 'Vérifier que la porte du bâtiment est ouverte', 'Au moins 15 min avant l''arrivée des clients', 8);

-- Closing checklist (clôture de la journée)
INSERT INTO checklist_templates (type, title, description, order_index) VALUES
('closing', 'Éteindre les machines de la halle de jeu', NULL, 1),
('closing', 'Éteindre les casques VR et manettes', NULL, 2),
('closing', 'Éteindre la machine à pop-corn', NULL, 3),
('closing', 'Éteindre la lumière du réfrigérateur', NULL, 4),
('closing', 'Passer un coup de chiffon sur les surfaces', 'Bar, salon, etc.', 5),
('closing', 'Passer l''aspirateur', 'Salle de bar, salon, hall d''entrée (escalier compris)', 6),
('closing', 'Passer la serpillère', 'Salle de bar, salon, hall d''entrée, toilettes', 7),
('closing', 'Éteindre toutes les lumières', 'Si tu es le dernier à partir', 8);

-- Weekly cleaning checklist (ménage hebdomadaire ~3h)
INSERT INTO checklist_templates (type, title, description, order_index) VALUES
('weekly_cleaning', 'Halles de jeux : aspirateur et poussière', 'Bureaux et écrans d''ordinateur', 1),
('weekly_cleaning', 'Salle de conférence', 'Aspirateur, panosse, tables', 2),
('weekly_cleaning', 'Bureaux de conception', 'Écrans, poussière, aspirateur, panosse', 3),
('weekly_cleaning', 'Cuisine : sol', 'Aspirateur et panosse (toutes les semaines)', 4),
('weekly_cleaning', 'Cuisine : nettoyage complet (1x/2 semaines)', 'Évier, micro-ondes, machine à pop-corn, machine à café', 5),
('weekly_cleaning', 'Vider toutes les poubelles', 'Sac blanc, s''assurer qu''un sac est présent, remplacer si sale', 6),
('weekly_cleaning', 'Remplir complètement le frigo des boissons', 'Avec tous les types de boissons au stock', 7),
('weekly_cleaning', 'Frigo du salon : nettoyage complet (1x/mois)', NULL, 8),
('weekly_cleaning', 'Arroser les plantes', NULL, 9),
('weekly_cleaning', 'Nettoyer les toilettes', 'Utiliser les chiffons bleus au stock', 10),
('weekly_cleaning', 'Remplir savon, essuie-mains et papier toilette', 'Dans la salle de bain', 11),
('weekly_cleaning', 'Nettoyer les fenêtres (1x/2 semaines)', 'Intérieur et extérieur', 12),
('weekly_cleaning', 'Nettoyer les portes et poignées', 'Portes des frigos, poignées de porte, portes de bureau', 13);

-- Link checklist items to relevant fiches
-- Opening: Quest 3 setup
INSERT INTO checklist_template_fiches (template_id, fiche_id)
SELECT t.id, f.id 
FROM checklist_templates t, procedure_fiches f
WHERE t.title = 'Allumer les équipements de jeu' 
AND f.title = '🚧 Configuration casques Quest 3';

-- Cleaning links
INSERT INTO checklist_template_fiches (template_id, fiche_id)
SELECT t.id, f.id 
FROM checklist_templates t, procedure_fiches f
WHERE t.type = 'weekly_cleaning' 
AND f.category = 'cleaning';
