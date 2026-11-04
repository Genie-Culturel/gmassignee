-- Pitch Serviteur I et II repris du site virtualrealitycenter.ch
update procedure_fiches set is_placeholder=false, version=version+1, content_steps='[
{"order":1,"text":"Pitch : alors que Sion déplore le vol du Manuscrit des 6 Âges du monde, pièce maîtresse des Archives cantonales du Valais, une série de meurtres secoue la capitale. Votre brigade temporelle est appelée à travers les âges pour empêcher qu''une nouvelle vie ne soit emportée. L''enquête commence en 1478 chez le Prince-évêque de Sion, Walter Supersaxo."},
{"order":2,"text":"« Vous jouez dans le Valais des chasses aux sorcières ! Forgez vos épées et défiez les démons du passé ! » Le chapitre I permet de prendre confiance dans l''expérience, les univers et le gameplay."},
{"order":3,"text":"Points forts : fouille, mécanismes, action, réflexion, collaboration, time challenge et rencontre de personnages historiques. Unique au monde, jouable seulement à Sion."},
{"order":4,"text":"Durée : 40-50 min de VR, prévoir 1h30 sur place. 2 à 16 joueurs (8 max par halle), dès 9 ans, FR/EN/DE."},
{"order":5,"text":"Après le chapitre I, proposer le chapitre II."}]'::jsonb
where title='Présentation : Le Serviteur I' and deleted_at is null;
update procedure_fiches set is_placeholder=false, version=version+1, content_steps='[
{"order":1,"text":"Pitch : en possession de vos trois clés et du mystérieux dé, bravez les ténèbres à travers le passage. Passés au XVIe siècle, mettez la main sur le manuscrit, entrez dans le deuxième âge du monde, armez-vous et regardez vers le ciel !"},
{"order":2,"text":"C''est la suite et la fin : on découvre enfin qui est le Serviteur de la Rédemption. Conseiller de jouer d''abord le chapitre I, ou les deux à la suite (la Saga)."},
{"order":3,"text":"Durée : 40-50 min de VR, prévoir 1h30 sur place. 2 à 16 joueurs (8 max par halle), dès 9 ans, FR/EN/DE."},
{"order":4,"text":"🚧 À compléter : points forts à mettre en avant."}]'::jsonb
where title='Présentation : Le Serviteur II' and deleted_at is null;
