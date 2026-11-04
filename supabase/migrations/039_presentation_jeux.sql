-- Une fiche de présentation par jeu VR Center, liées à l'étape game_intro
do $$
declare r record; fid uuid; i int := 0;
begin
for r in select * from (values
 ('Présentation : Bataille de la Planta','640253ab-68e6-4f13-a1ee-26b6062bfa19',
  '[{"order":1,"text":"🚧 À compléter : histoire et pitch du jeu."},{"order":2,"text":"Sion au XVe siècle : la bataille de la Planta."},{"order":3,"text":"Durée : 45 min de jeu, prévoir 1h30 sur place."},{"order":4,"text":"2 à 16 joueurs (8 max par halle)."},{"order":5,"text":"🚧 À compléter : points forts à mettre en avant."}]'),
 ('Présentation : La Saga','b9b97735-bd63-4868-8db1-ea9acff751e1',
  '[{"order":1,"text":"🚧 À compléter : histoire et pitch du jeu."},{"order":2,"text":"2 chapitres, avec une pause pop-corn de 15 min entre les deux."},{"order":3,"text":"Durée totale : 1h30 de VR, prévoir 2h sur place."},{"order":4,"text":"🚧 À compléter : points forts à mettre en avant."}]'),
 ('Présentation : Le Serviteur I','9ec03b20-220b-4fb8-8194-328481427d95',
  '[{"order":1,"text":"🚧 À compléter : histoire et pitch du jeu."},{"order":2,"text":"Durée : 40-50 min de VR, prévoir 1h30 sur place."},{"order":3,"text":"2 à 16 joueurs (8 max par halle)."},{"order":4,"text":"🚧 À compléter : points forts à mettre en avant."}]'),
 ('Présentation : Le Serviteur II','9ec03b20-220b-4fb8-8194-328481427d95',
  '[{"order":1,"text":"🚧 À compléter : histoire et pitch du jeu."},{"order":2,"text":"🚧 À compléter : durée et nombre de joueurs."},{"order":3,"text":"🚧 À compléter : points forts à mettre en avant."}]'),
 ('Présentation : Schoolcrafter','122aed88-1d3a-4c7a-9721-3b612b1cdbfb',
  '[{"order":1,"text":"🚧 À compléter : présentation de Schoolcrafter."},{"order":2,"text":"🚧 À compléter : durée, public et nombre de joueurs."},{"order":3,"text":"🚧 À compléter : points forts à mettre en avant."}]')
) v(t,g,c) loop
 i := i + 1; fid := gen_random_uuid();
 insert into procedure_fiches (id, category, title, summary, content_steps, is_placeholder, tags, is_active, version, is_required, scope_kind, sort_order, sub_group)
 values (fid,'procedure_deroulement',r.t,'Comment présenter ce jeu aux clients.',r.c::jsonb,true,array['présentation','jeu'],true,1,false,'games',55+i,'vr_center');
 insert into fiche_scope_games (fiche_id, game_id) values (fid, r.g::uuid);
 insert into session_step_fiches (step, fiche_id, parcours_id) values ('game_intro', fid, 'vr_centre_client');
end loop;
end $$;
