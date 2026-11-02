-- Restructure formation into top-level categories
-- 1. Formation technique: hardware / setup
-- 2. Procédure et déroulement: client flow and operations
-- (Troubleshooting moves to depannage_bugs in 010.)

-- First, we need to add new category values and remove old ones
-- Since we can't modify enum values directly in PostgreSQL, we'll:
-- 1. Add new categories
-- 2. Update existing fiches
-- 3. Create a new enum and swap it (or just use the current one with new values)

-- Enum values 'formation_technique' and 'procedure_deroulement' are added in
-- 003b_add_fiche_category_enum_values.sql (must commit before this transaction).
-- The old values remain in the enum but are no longer used for new fiches.

-- Update all existing fiches to use the new 2-category structure

-- Formation technique: equipment_setup, game_launch, troubleshooting, cleaning (headsets)
UPDATE procedure_fiches SET category = 'formation_technique'
WHERE category IN ('equipment_setup', 'game_launch', 'troubleshooting')
   OR (category = 'cleaning' AND title LIKE '%casques%');

-- Procédure et déroulement: parcours_client, client_experience, safety, cleaning (other)
UPDATE procedure_fiches SET category = 'procedure_deroulement'
WHERE category IN ('parcours_client', 'client_experience', 'safety')
   OR (category = 'cleaning' AND title NOT LIKE '%casques%');

-- Any 'other' category fiches go to procedure_deroulement by default
UPDATE procedure_fiches SET category = 'procedure_deroulement'
WHERE category = 'other';

-- Verify the update with a summary
DO $$
BEGIN
  RAISE NOTICE 'Migration 006 complete:';
  RAISE NOTICE 'Formation technique: % fiches', (SELECT COUNT(*) FROM procedure_fiches WHERE category = 'formation_technique');
  RAISE NOTICE 'Procédure et déroulement: % fiches', (SELECT COUNT(*) FROM procedure_fiches WHERE category = 'procedure_deroulement');
END $$;

COMMENT ON TYPE fiche_category IS 'Formation categories: formation_technique (hardware/troubleshooting), procedure_deroulement (client flow/operations). Legacy values kept for compatibility.';
