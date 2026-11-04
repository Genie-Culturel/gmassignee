-- Étape « Préparer la salle » (VR Center), avant l'accueil des clients
do $$
declare fid uuid := gen_random_uuid();
begin
insert into procedure_fiches (id, category, title, summary, content_steps, is_placeholder, tags, is_active, version, is_required, scope_kind, sort_order, sub_group)
values (fid, 'procedure_deroulement', 'Préparer la salle',
 'Choisir la halle de jeu (A de préférence) et la préparer avant l''arrivée des clients.',
 '[{"order":1,"text":"Déterminer dans quelle halle le jeu aura lieu : salle A ou salle B. Privilégier la salle A."},
   {"order":2,"text":"Allumer les lumières de la halle."},
   {"order":3,"text":"Fermer les fenêtres."},
   {"order":4,"text":"Allumer les casques Meta Quest 3 et lancer le programme du jeu."}]'::jsonb,
 false, array['halle','préparation'], true, 1, true, 'locations', 15, 'vr_center');
insert into fiche_scope_locations (fiche_id, location_id)
 select fid, location_id from fiche_scope_locations where fiche_id='ac42e860-2671-4261-93d0-d9dd52944266';
insert into parcours_steps (parcours_id, step_key, label, hint, sort_order, is_active)
values ('vr_centre_client','room_prep','Préparer la salle','Choisir la halle (A de préférence), allumer les lumières, fermer les fenêtres, allumer les casques.',15,true);
insert into session_step_fiches (step, fiche_id, parcours_id) values ('room_prep', fid, 'vr_centre_client');
end $$;
