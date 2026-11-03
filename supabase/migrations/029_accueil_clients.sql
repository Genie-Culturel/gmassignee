-- 029 : étape et fiche « Accueil des clients » (VR Center) + TV du salon dans le setup du lobby
update public.parcours_steps set
  label = 'Accueil des clients',
  hint = 'Accueillir le groupe, l''installer à une table du lobby (salon si le lobby est plein), faire connaissance, puis pop-corn, boissons et check-in.',
  sort_order = 25, is_active = true, deleted_at = null
where parcours_id = 'vr_centre_client' and step_key = 'reception_seating';

update public.procedure_fiches set
  title = 'Accueil des clients',
  summary = 'Accueillir le groupe au lobby, l''installer et faire connaissance avant le check-in.',
  content_steps = '[
    {"order":1,"text":"Accueillir chaleureusement le groupe dès son arrivée."},
    {"order":2,"text":"Installer le groupe à une des 2 tables du lobby (tables de 6 places), en ajoutant les chaises de réserve si besoin."},
    {"order":3,"text":"Se présenter, présenter rapidement le studio et faire connaissance : qui sont-ils, pourquoi sont-ils venus, comment nous ont-ils connus ?"},
    {"order":4,"text":"Si plusieurs groupes se croisent et que le lobby est plein, installer le deuxième groupe au salon."},
    {"order":5,"text":"Offrir le pop-corn et proposer les boissons (voir les fiches dédiées)."},
    {"order":6,"text":"Passer ensuite au check-in QR."}
  ]'::jsonb,
  is_placeholder = false,
  version = version + 1
where id = 'ac42e860-2671-4261-93d0-d9dd52944266';

delete from public.quiz_questions where fiche_id = 'ac42e860-2671-4261-93d0-d9dd52944266';
insert into public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example) values
('ac42e860-2671-4261-93d0-d9dd52944266',
 'Où installe-t-on un groupe qui arrive ?',
 '[{"id":"lobby","text":"À une des tables du lobby"},{"id":"halle","text":"Directement en halle"},{"id":"salon","text":"Toujours au salon"}]'::jsonb,
 array['lobby'], 1, false),
('ac42e860-2671-4261-93d0-d9dd52944266',
 'Le lobby est plein car plusieurs groupes se croisent. Où installer le deuxième groupe ?',
 '[{"id":"salon","text":"Au salon"},{"id":"dehors","text":"Le faire attendre dehors"},{"id":"halle","text":"En halle de jeu"}]'::jsonb,
 array['salon'], 2, false);

update public.procedure_fiches set
  content_steps = '[
    {"order":1,"text":"Ouvrir la porte d''entrée du bâtiment au moins 15 minutes avant l''arrivée des premiers clients."},
    {"order":2,"text":"Préparation du bar : allumer les lumières, sans oublier celle du réfrigérateur des boissons clients ; mettre en marche la machine à pop-corn pour qu''elle chauffe."},
    {"order":3,"text":"Allumer la musique d''ambiance. C''est important : elle doit tourner avant l''arrivée des clients."},
    {"order":4,"text":"Allumer la TV du salon."},
    {"order":5,"text":"Contrôle des stocks : boissons dans le réfrigérateur ; papier toilette ; serviettes en papier pour les mains dans les WC."},
    {"order":6,"text":"Contrôler l''état de rangement et de propreté des espaces d''accueil (bar et accueil) et faire le nécessaire en cas de besoin."}
  ]'::jsonb,
  version = version + 1
where id = '613c1366-39b9-4485-a3b0-6df30dcfd2df';
