-- 032 : Procédure des boissons, retrait du point facture entreprises
update public.procedure_fiches set
  content_steps = (
    select jsonb_agg(jsonb_set(e, '{order}', to_jsonb(rn::int)) order by rn)
    from (select e, row_number() over (order by (e->>'order')::int) rn
          from jsonb_array_elements(content_steps) e
          where e->>'text' not ilike 'Entreprises :%') t),
  version = version + 1
where id = '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58';
update public.parcours_steps set
  hint = 'Offrir le pop-corn, proposer les boissons, noter les consommations et tout encaisser par Twint avant le départ du groupe.'
where parcours_id = 'vr_centre_client' and step_key = 'reception_popcorn';
