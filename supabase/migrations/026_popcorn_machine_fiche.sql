-- 026 : fiche « Utilisation de la machine à pop-corn » (VR Center, étape Pop-corn)
update public.procedure_fiches set
  title = 'Utilisation de la machine à pop-corn',
  summary = 'Allumer, lancer la cuisson, servir et éteindre la machine à pop-corn.',
  content_steps = '[
    {"order":1,"text":"Allumer au setup (45 min avant les clients) : interrupteur POWER & LIGHT, puis HEAT pour préchauffer la cuve."},
    {"order":2,"text":"Lancer la cuisson avant l''arrivée des clients : verser l''huile et le maïs dans la cuve, enclencher TURN (mélangeur), fermer les portes et laisser éclater."},
    {"order":3,"text":"Quand l''éclatement est presque terminé, basculer la cuve avec la poignée pour vider le pop-corn dans le bac."},
    {"order":4,"text":"Servir le pop-corn aux clients dès leur installation. Laisser la lumière allumée pour le garder au chaud."},
    {"order":5,"text":"Éteindre la machine à la fin de la journée : HEAT et TURN, puis POWER & LIGHT (voir le post-it sur la machine)."},
    {"order":6,"text":"Nettoyage à fond de la machine toutes les 2 semaines (plan de nettoyage)."}
  ]'::jsonb,
  is_placeholder = false,
  version = version + 1
where id = 'f0b61e03-8884-4d8f-baa4-a0996d45144c';

delete from public.quiz_questions where fiche_id = 'f0b61e03-8884-4d8f-baa4-a0996d45144c';
insert into public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example) values
('f0b61e03-8884-4d8f-baa4-a0996d45144c',
 'Quels interrupteurs allume-t-on en premier pour préchauffer la machine à pop-corn ?',
 '[{"id":"power_heat","text":"POWER & LIGHT puis HEAT"},{"id":"turn","text":"TURN seul"},{"id":"aucun","text":"Aucun, la machine reste allumée en permanence"}]'::jsonb,
 array['power_heat'], 1, false),
('f0b61e03-8884-4d8f-baa4-a0996d45144c',
 'Que doit-on faire avec la machine à pop-corn en fin de journée ?',
 '[{"id":"eteindre","text":"L''éteindre complètement"},{"id":"chaud","text":"La laisser allumée pour le lendemain"},{"id":"lumiere","text":"Éteindre seulement la lumière"}]'::jsonb,
 array['eteindre'], 2, false);
