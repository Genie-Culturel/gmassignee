-- Official game names (Julien, 2026-11-03). Slugs unchanged.
update games set name = case slug
  when 'planta' then 'Bataille de la Planta'
  when 'serviteur' then 'Le Serviteur 1 & 2'
  when 'saga' then 'La Saga'
  when 'usine_chandoline' then 'Novasphère'
  when 'davinci' then 'Da Vinci Code'
  when 'feux_sacres' then 'Le Feu sacré'
  else name end;
update procedure_fiches set title = replace(title, 'Lancement Usine de Chandoline', 'Lancement Novasphère')
  where title like '%Lancement Usine de Chandoline%';
