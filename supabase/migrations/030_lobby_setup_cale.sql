-- 030 : Setup du lobby, cale en bois pour la porte d'entrée
update public.procedure_fiches set
  content_steps = jsonb_set(content_steps, '{0,text}',
    to_jsonb('Ouvrir la porte d''entrée du bâtiment au moins 15 minutes avant l''arrivée des premiers clients, et la bloquer avec la cale en bois.'::text)),
  version = version + 1
where id = '613c1366-39b9-4485-a3b0-6df30dcfd2df';
