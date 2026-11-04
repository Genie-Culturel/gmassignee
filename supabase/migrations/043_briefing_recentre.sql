-- Briefing de sécurité recentré sur la sécurité
update procedure_fiches set version = version + 1, content_steps = '[
{"order":1,"text":"Demander si les clients ont déjà fait de la VR."},
{"order":2,"text":"Expliquer le mal des transports (motion sickness) : on a mal au cœur quand les yeux et le corps ne sont pas d''accord. Chez soi, avec un joystick, le personnage avance alors que le corps reste immobile sur le canapé. C''est comme être assis à l''envers du sens de marche dans le train."},
{"order":3,"text":"Rassurer : ici, personne ne va être malade, car on se déplace en 1 pour 1, comme dans la vraie vie. Un pas dans la halle, c''est un pas dans le jeu."},
{"order":4,"text":"Expliquer : interaction et coopération possibles (vous vous voyez, vous pouvez échanger des objets)."},
{"order":5,"text":"Zone de jeu : respecter les limites du Guardian."},
{"order":6,"text":"En cas de malaise : lever la main, on retire le casque immédiatement."},
{"order":7,"text":"🚧 Les « 10 commandements de la VR » (détails à compléter)."}]'::jsonb
where title = 'Briefing de sécurité' and deleted_at is null
 and id in (select fiche_id from session_step_fiches where parcours_id='vr_centre_client');
