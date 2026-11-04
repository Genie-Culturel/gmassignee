update procedure_fiches set summary = 'La Saga : le Serviteur I puis le Serviteur II joués à la suite par la même équipe.',
 content_steps = '[{"order":1,"text":"La Saga n''est pas un jeu à part : c''est quand une équipe joue le Serviteur I puis le Serviteur II à la suite."},{"order":2,"text":"Présenter les deux chapitres (voir les fiches de présentation du Serviteur I et du Serviteur II)."},{"order":3,"text":"Pause pop-corn de 15 min entre les deux chapitres."},{"order":4,"text":"Durée totale : 1h30 de VR, prévoir 2h sur place."},{"order":5,"text":"🚧 À compléter : procédure spécifique de la Saga."}]'::jsonb,
 version = version + 1
where title = 'Présentation : La Saga' and deleted_at is null;
-- Déroulement Saga (site VR Center) ajouté en étape 5, appliqué directement
