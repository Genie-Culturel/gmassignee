-- 028 : Setup du lobby, ajout de la musique d'ambiance
update public.procedure_fiches set
  content_steps = '[
    {"order":1,"text":"Ouvrir la porte d''entrée du bâtiment au moins 15 minutes avant l''arrivée des premiers clients."},
    {"order":2,"text":"Préparation du bar : allumer les lumières, sans oublier celle du réfrigérateur des boissons clients ; mettre en marche la machine à pop-corn pour qu''elle chauffe."},
    {"order":3,"text":"Allumer la musique d''ambiance. C''est important : elle doit tourner avant l''arrivée des clients."},
    {"order":4,"text":"Contrôle des stocks : boissons dans le réfrigérateur ; papier toilette ; serviettes en papier pour les mains dans les WC."},
    {"order":5,"text":"Contrôler l''état de rangement et de propreté des espaces d''accueil (bar et accueil) et faire le nécessaire en cas de besoin."}
  ]'::jsonb,
  version = version + 1
where id = '613c1366-39b9-4485-a3b0-6df30dcfd2df';
