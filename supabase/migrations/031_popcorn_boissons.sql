-- 031 : étape « Pop-corn & boissons » (VR Center) + fiche « Procédure des boissons »
update public.parcours_steps set
  label = 'Pop-corn & boissons',
  hint = 'Offrir le pop-corn, proposer les boissons, noter les consommations et tout encaisser (Twint) avant le départ du groupe.',
  sort_order = 28
where parcours_id = 'vr_centre_client' and step_key = 'reception_popcorn';

-- l'ancienne étape Boissons est fusionnée dans Pop-corn & boissons
update public.parcours_steps set is_active = false, deleted_at = now()
where parcours_id = 'vr_centre_client' and step_key = 'reception_drinks';

update public.procedure_fiches set
  title = 'Procédure des boissons',
  summary = 'Proposer, noter et encaisser les boissons, puis reporter les ventes dans GMassignee.',
  content_steps = '[
    {"order":1,"text":"Avant l''arrivée des clients, contrôler que le frigo des boissons clients est plein. S''il manque des boissons, le signaler à l''admin."},
    {"order":2,"text":"Proposer les boissons du frigo aux clients. L''eau est à disposition gratuitement."},
    {"order":3,"text":"Noter toutes les boissons consommées par le groupe au fur et à mesure."},
    {"order":4,"text":"Encaisser à la fin, avant le départ des clients : annoncer le total, le client paie par Twint en scannant le QR code du centre, puis vérifier la confirmation du paiement sur son téléphone."},
    {"order":5,"text":"Entreprises : demander au responsable du groupe s''il souhaite une facture au lieu du paiement Twint."},
    {"order":6,"text":"Ne pas oublier de reporter les ventes en détail dans GMassignee (suivi de la session : boissons, quantités, montant encaissé)."}
  ]'::jsonb,
  is_placeholder = false,
  version = version + 1
where id = '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58';

insert into public.session_step_fiches (step, fiche_id, parcours_id)
select 'reception_popcorn', '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58', 'vr_centre_client'
where not exists (select 1 from public.session_step_fiches
  where step = 'reception_popcorn' and fiche_id = '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58' and parcours_id = 'vr_centre_client');

delete from public.quiz_questions where fiche_id = '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58';
insert into public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example) values
('0ab0b80e-fd96-42c9-b8f8-572f26bb7f58',
 'Quand encaisse-t-on les boissons consommées par un groupe ?',
 '[{"id":"fin","text":"À la fin, avant le départ des clients"},{"id":"chaque","text":"À chaque boisson servie"},{"id":"jamais","text":"On ne les encaisse pas, elles sont offertes"}]'::jsonb,
 array['fin'], 1, false),
('0ab0b80e-fd96-42c9-b8f8-572f26bb7f58',
 'Une fois les boissons encaissées, que faut-il encore faire ?',
 '[{"id":"gma","text":"Reporter les ventes en détail dans GMassignee"},{"id":"rien","text":"Rien"},{"id":"mail","text":"Envoyer un e-mail au client"}]'::jsonb,
 array['gma'], 2, false);
