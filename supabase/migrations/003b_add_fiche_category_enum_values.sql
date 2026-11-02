-- Add fiche_category enum values in their own transaction.
-- PostgreSQL cannot use a newly added enum value in the same transaction
-- as ALTER TYPE ... ADD VALUE, so this file must run (and commit) before
-- 004 (uses 'parcours_client') and 006 (uses 'formation_technique' /
-- 'procedure_deroulement').

ALTER TYPE fiche_category ADD VALUE IF NOT EXISTS 'parcours_client';
ALTER TYPE fiche_category ADD VALUE IF NOT EXISTS 'formation_technique';
ALTER TYPE fiche_category ADD VALUE IF NOT EXISTS 'procedure_deroulement';
