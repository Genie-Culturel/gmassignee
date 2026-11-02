-- Move in-game / headset troubleshooting fiches into 'depannage_bugs'.
-- Formation technique keeps setup and equipment (Quest 3, lancement, recharge).

UPDATE procedure_fiches
SET category = 'depannage_bugs'
WHERE title ILIKE '%Dépannage%'
   OR title ILIKE '%Tracking perdu%';

COMMENT ON TYPE fiche_category IS
  'Formation categories: formation_technique (setup/equipment), procedure_deroulement (client flow), depannage_bugs (in-game problems, freezes, headset issues). Legacy values kept for compatibility.';
