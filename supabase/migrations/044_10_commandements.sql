-- 10 commandements (virtualrealitycenter.ch/les-10-commandements, page du QR Check in)
update procedure_fiches set version = version + 1,
 content_steps = jsonb_set(jsonb_set(content_steps,
 '{4,text}', to_jsonb('Zone de jeu : rester dans le monde virtuel. Ne pas traverser les murs ni franchir les abîmes du jeu, et ne jamais franchir les lignes de grille rouges, qui marquent les limites de jeu.'::text)),
 '{6,text}', to_jsonb('Rappeler les 10 commandements que les clients ont lus au check-in : suivre les instructions du GM ; ne rien lancer, balancer ni laisser tomber, pas de force excessive ; ne pas s''asseoir ni s''allonger ; garder une distance de sécurité entre joueurs ; pas d''alcool ni d''ivresse ; signaler épilepsie, pacemaker ou grossesse ; une violation des règles peut faire arrêter l''expérience et le participant est responsable des dommages qu''il cause ; et surtout, avoir beaucoup de fun !'::text)),
 summary = 'Rassurer sur le mal des transports et rappeler les règles de sécurité (10 commandements).'
where title = 'Briefing de sécurité' and deleted_at is null
 and id in (select fiche_id from session_step_fiches where parcours_id='vr_centre_client');

update procedure_fiches set version = version + 1,
 content_steps = jsonb_set(content_steps, '{1,text}', to_jsonb('Contre-indications : épilepsie, pacemaker ou grossesse. Ces personnes doivent en parler au GM, qui les informe des risques liés au jeu (commandement n° 8).'::text))
where title ilike '%Contre-indications et règles de sécurité%' and deleted_at is null;
