-- Add 'depannage_bugs' in its own transaction.
-- PostgreSQL cannot use a newly added enum value in the same transaction
-- as ALTER TYPE ... ADD VALUE — 010 consumes this value.

ALTER TYPE fiche_category ADD VALUE IF NOT EXISTS 'depannage_bugs';
