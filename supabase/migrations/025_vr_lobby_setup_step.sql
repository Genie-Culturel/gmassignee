-- 025: VR Center — nouvelle 1re étape « Setup du lobby » (avant l'arrivée des clients)
-- + fiche liée « Setup du lobby » (procédure & déroulement, VR Center, obligatoire) + 2 questions de contrôle.
-- « Installation au lobby » (reception_seating, sort_order 20) reste l'étape suivante, inchangée.

do $$
declare
  v_fiche uuid;
  v_loc uuid;
begin
  select id into v_loc from public.locations where slug = 'vr_center';

  select id into v_fiche from public.procedure_fiches
   where title = 'Setup du lobby' and deleted_at is null limit 1;

  if v_fiche is null then
    insert into public.procedure_fiches
      (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind, sort_order)
    values (
      'procedure_deroulement',
      'Setup du lobby',
      'Préparer le lobby et le bar avant l''arrivée des premiers clients.',
      jsonb_build_array(
        jsonb_build_object('order', 1, 'text', 'Ouvrir la porte d''entrée du bâtiment au moins 15 minutes avant l''arrivée des premiers clients.'),
        jsonb_build_object('order', 2, 'text', 'Préparation du bar : allumer les lumières, sans oublier celle du réfrigérateur des boissons clients ; mettre en marche la machine à pop-corn pour qu''elle chauffe.'),
        jsonb_build_object('order', 3, 'text', 'Contrôle des stocks : boissons dans le réfrigérateur ; papier toilette ; serviettes en papier pour les mains dans les WC.'),
        jsonb_build_object('order', 4, 'text', 'Contrôler l''état de rangement et de propreté des espaces d''accueil (bar et accueil) et faire le nécessaire en cas de besoin.')
      ),
      false,
      array['lobby', 'setup', 'ouverture', 'bar'],
      true,
      true,
      'locations',
      5
    )
    returning id into v_fiche;
  end if;

  if v_loc is not null then
    insert into public.fiche_scope_locations (fiche_id, location_id)
    values (v_fiche, v_loc)
    on conflict do nothing;
  end if;

  delete from public.quiz_questions where fiche_id = v_fiche;
  insert into public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example) values
    (v_fiche,
     'Combien de temps avant l''arrivée des premiers clients faut-il ouvrir la porte d''entrée du bâtiment ?',
     '[{"id":"5","text":"5 minutes"},{"id":"15","text":"Au moins 15 minutes"},{"id":"arrivee","text":"Seulement quand les clients sonnent"}]'::jsonb,
     array['15'], 1, false),
    (v_fiche,
     'Quelle lumière ne faut-il pas oublier d''allumer en préparant le bar ?',
     '[{"id":"frigo","text":"Celle du réfrigérateur des boissons clients"},{"id":"halle","text":"Celle des halles de jeu"},{"id":"wc","text":"Celle des WC"}]'::jsonb,
     array['frigo'], 2, false);

  if not exists (select 1 from public.parcours_steps
                  where parcours_id = 'vr_centre_client' and step_key = 'lobby_setup' and deleted_at is null) then
    insert into public.parcours_steps (parcours_id, step_key, label, hint, note, sort_order, is_active)
    values ('vr_centre_client', 'lobby_setup', 'Setup du lobby',
            'Avant l''arrivée des clients : porte ouverte 15 min avant, bar prêt, stocks et propreté contrôlés.',
            null, 10, true);
  end if;

  insert into public.session_step_fiches (parcours_id, step, fiche_id)
  values ('vr_centre_client', 'lobby_setup', v_fiche)
  on conflict do nothing;
end $$;
