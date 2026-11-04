-- Supprime le doublon (non lié) de la fiche Check-in QR
update procedure_fiches set deleted_at = now() where id = '24ebe0ed-d405-4dd5-ad36-13953c2c638e';
