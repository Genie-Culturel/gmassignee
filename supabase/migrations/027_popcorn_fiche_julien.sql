-- 027 : fiche pop-corn corrigée par Julien (dose d'huile, durée, nettoyage après service)
update public.procedure_fiches set
  content_steps = '[
    {"order":1,"text":"Allumer au setup : interrupteur POWER & LIGHT, puis HEAT pour préchauffer la cuve."},
    {"order":2,"text":"Lancer la cuisson avant l''arrivée des clients : verser l''huile (une cuillère à soupe pour une grosse dose) et le maïs dans la cuve, enclencher TURN (mélangeur), fermer les portes et laisser éclater."},
    {"order":3,"text":"Quand l''éclatement est terminé (environ 3 minutes), basculer la cuve avec la poignée pour vider le pop-corn dans le bac."},
    {"order":4,"text":"Servir le pop-corn aux clients dès leur installation. Laisser la lumière allumée pour le garder au chaud."},
    {"order":5,"text":"Éteindre la machine à la fin de la journée : HEAT et TURN, puis POWER & LIGHT (voir le post-it sur la machine)."},
    {"order":6,"text":"Nettoyage après le service : retirer le pop-corn restant, puis nettoyer la machine."}
  ]'::jsonb,
  version = version + 1
where id = 'f0b61e03-8884-4d8f-baa4-a0996d45144c';
