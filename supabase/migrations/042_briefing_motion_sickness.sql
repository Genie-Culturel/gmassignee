-- Briefing de sécurité : commencer par le mal des transports (motion sickness)
update procedure_fiches set version = version + 1, content_steps = '[
{"order":1,"text":"Commencer par expliquer le mal des transports en VR (motion sickness) : on a mal au cœur quand ce que voient les yeux ne correspond pas à ce que ressent le corps. Le cerveau reçoit deux informations contradictoires."},
{"order":2,"text":"Expliquer pourquoi des gens sont malades en jouant chez eux : avec un joystick, le personnage avance dans le jeu alors que le corps reste immobile sur le canapé. Les yeux disent « je bouge », le corps dit « je ne bouge pas »."},
{"order":3,"text":"Donner l''exemple du train : quand on est assis à l''envers du sens de marche, on voit le paysage partir dans un sens que le corps n''attend pas, et certaines personnes se sentent mal. C''est le même mécanisme."},
{"order":4,"text":"Rassurer : ici, personne ne va être malade, car on se déplace en 1 pour 1, comme dans la vraie vie. Quand tu fais un pas dans la halle, tu fais un pas dans le jeu : les yeux et le corps sont d''accord."},
{"order":5,"text":"Demander si les clients ont déjà fait de la VR."},
{"order":6,"text":"Présenter : conception home-made à Sion, innovations techniques."},
{"order":7,"text":"Expliquer : interaction et coopération possibles (vous vous voyez, vous pouvez échanger des objets)."},
{"order":8,"text":"Contexte : Sion au XVe siècle, scénario selon le jeu choisi (adapter ton pitch)."},
{"order":9,"text":"Zone de jeu : respecter les limites du Guardian."},
{"order":10,"text":"En cas de malaise : lever la main, on retire le casque immédiatement."},
{"order":11,"text":"🚧 Les « 10 commandements de la VR » (détails à compléter)."}]'::jsonb
where title = 'Briefing de sécurité' and deleted_at is null
 and id in (select fiche_id from session_step_fiches where parcours_id='vr_centre_client');
