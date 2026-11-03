-- 033 : restauration de la fiche « Accueil des clients » (supprimée lors d'un test) et nettoyage du lien vers l'étape TEST
update public.procedure_fiches set deleted_at = null, is_active = true
where id = 'ac42e860-2671-4261-93d0-d9dd52944266';
delete from public.session_step_fiches
where fiche_id = 'ac42e860-2671-4261-93d0-d9dd52944266' and step = 'vr_mw0to5lrg0sk';
