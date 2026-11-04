-- Réponses de Julien du 2026-11-04
update procedure_fiches set content_steps = jsonb_set(jsonb_set(content_steps,
 '{3,text}', to_jsonb('Servir le pop-corn aux clients dès leur installation : une portion est offerte à chaque client (valeur CHF 4.–). Un supplément demandé est payant (CHF 4.–). Laisser la lumière allumée pour le garder au chaud.'::text)),
 '{5,text}', to_jsonb('Après le service : le pop-corn restant reste dans le bac de la machine éteinte. Nettoyer la machine.'::text)),
 version = version + 1
where id = 'f0b61e03-8884-4d8f-baa4-a0996d45144c';

update procedure_fiches set content_steps = jsonb_set(jsonb_set(content_steps,
 '{0,text}', to_jsonb('Avant l''arrivée des clients, contrôler que le frigo des boissons clients est plein. S''il manque des boissons et qu''il n''y a personne au secrétariat, le signaler dans une remarque à la fin de la session de jeu.'::text)),
 '{3,text}', to_jsonb('Encaisser à la fin, avant le départ des clients : annoncer le total, le client paie par Twint en scannant le QR code affiché sur le frigo ou sur la carte, puis vérifier la confirmation du paiement sur son téléphone.'::text)),
 version = version + 1
where id = '0ab0b80e-fd96-42c9-b8f8-572f26bb7f58';
