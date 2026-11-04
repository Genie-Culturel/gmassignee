update procedure_fiches set content_steps = '[
 {"order":1,"text":"Déterminer dans quelle halle le jeu aura lieu : salle A ou salle B. Privilégier la salle A."},
 {"order":2,"text":"Allumer les lumières de la halle."},
 {"order":3,"text":"Fermer les fenêtres."},
 {"order":4,"text":"Allumer les machines de la halle."},
 {"order":5,"text":"Allumer les casques Meta Quest 3 et lancer le programme du jeu (voir la fiche « Configuration casques Quest 3 »)."},
 {"order":6,"text":"🚧 À compléter : autres points de préparation de la halle (ordre d''allumage PC/casques, zone de jeu Guardian, rangement, etc.)."}
]'::jsonb, version = version + 1
where title = 'Préparer la salle' and deleted_at is null;
