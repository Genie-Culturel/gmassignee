#!/usr/bin/env node
/**
 * Rebuild demo catalogue TS from a read-only live export.
 * Usage: node scripts/gen_demo_from_export.mjs [export-dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.resolve(process.argv[2] || '/cursor/stores/bot/demo-export');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, name), 'utf8'));
}

function ts(value) {
  return JSON.stringify(value, null, 2);
}

const locations = readJson('gh_locations.json');
const games = readJson('gh_games.json');
const fiches = readJson('fiches.json');
const quizzes = readJson('gh_quiz_questions.json');
const links = readJson('demo_step_fiche_links.json');
const parcoursRows = readJson('gh_parcours.json');
const parcoursSteps = readJson('gh_parcours_steps.json');

const locById = new Map(locations.map((row) => [row.id, row]));
const gameById = new Map(games.map((row) => [row.id, row]));
const liveFicheIds = new Set(fiches.map((row) => row.id));
const liveStepKeys = new Set(
  parcoursSteps.filter((row) => !row.deleted_at).map((row) => `${row.parcours_id}:${row.step_key}`)
);

const PII = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+41[\d\s]{8,}|\b0\d{2}[\s.]?\d{3}[\s.]?\d{2}[\s.]?\d{2}\b)/i;
const piiHits = [];

function remapLocIds(ids, slugs) {
  if (Array.isArray(slugs) && slugs.length) return slugs.map((slug) => `loc-${slug}`);
  return (ids || []).map((id) => {
    const loc = locById.get(id);
    if (!loc) throw new Error(`Unknown location id ${id}`);
    return `loc-${loc.slug}`;
  });
}

function remapGameIds(ids, slugs) {
  if (Array.isArray(slugs) && slugs.length) return slugs.map((slug) => `game-${slug}`);
  return (ids || []).map((id) => {
    const game = gameById.get(id);
    if (!game) throw new Error(`Unknown game id ${id}`);
    return `game-${game.slug}`;
  });
}

function stripSteps(steps) {
  return (steps || []).map((step, index) => {
    const text = typeof step.text === 'string' ? step.text : '';
    if (PII.test(text)) piiHits.push(`step text: ${text.slice(0, 80)}`);
    return { order: Number(step.order) || index + 1, text };
  });
}

const CATEGORY_ORDER = {
  formation_technique: 0,
  procedure_deroulement: 1,
  depannage_bugs: 2,
};

const demoFiches = [...fiches]
  .sort((a, b) => {
    const cat = (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9);
    if (cat) return cat;
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order) return order;
    return String(a.title).localeCompare(String(b.title), 'fr');
  })
  .map((fiche) => {
    const blob = `${fiche.title}\n${fiche.summary || ''}`;
    if (PII.test(blob)) piiHits.push(`fiche ${fiche.id}: ${fiche.title}`);
    return {
      id: fiche.id,
      category: fiche.category,
      title: fiche.title,
      summary: fiche.summary ?? null,
      content_steps: stripSteps(fiche.content_steps),
      is_placeholder: Boolean(fiche.is_placeholder),
      tags: Array.isArray(fiche.tags) ? fiche.tags : [],
      is_active: Boolean(fiche.is_active),
      version: fiche.version ?? 1,
      is_required: fiche.is_required !== false,
      skip_version_bump: Boolean(fiche.skip_version_bump),
      deleted_at: fiche.deleted_at ?? null,
      sort_order: fiche.sort_order ?? 0,
      scope_kind: fiche.scope_kind || 'all',
      sub_group: fiche.sub_group === undefined ? null : fiche.sub_group,
      scope_location_ids: remapLocIds(fiche.scope_location_ids, fiche.scope_location_slugs),
      scope_game_ids: remapGameIds(fiche.scope_game_ids, fiche.scope_game_slugs),
      created_at: fiche.created_at,
      updated_at: fiche.updated_at,
    };
  });

const demoQuiz = quizzes
  .filter((row) => liveFicheIds.has(row.fiche_id))
  .sort((a, b) => a.fiche_id.localeCompare(b.fiche_id) || a.order_index - b.order_index)
  .map((row) => {
    if (PII.test(row.prompt) || JSON.stringify(row.choices).match(PII)) {
      piiHits.push(`quiz ${row.id}`);
    }
    return {
      id: row.id,
      fiche_id: row.fiche_id,
      prompt: row.prompt,
      choices: row.choices,
      correct_choice_ids: row.correct_choice_ids,
      order_index: row.order_index,
      is_example: Boolean(row.is_example),
    };
  });

const demoLinks = {};
for (const [key, ids] of Object.entries(links)) {
  if (!liveStepKeys.has(key)) continue;
  const kept = (ids || []).filter((id) => liveFicheIds.has(id));
  if (kept.length) demoLinks[key] = kept;
}

const PARCOURS_ORDER = ['vr_centre_client', 'chandoline', 'escape_life_sion', 'escape_life_sierre'];
const locSlugById = new Map(locations.map((row) => [row.id, row.slug]));
const demoParcours = PARCOURS_ORDER.map((id) => {
  const row = parcoursRows.find((item) => item.id === id);
  if (!row) throw new Error(`Missing parcours ${id}`);
  const steps = parcoursSteps
    .filter((step) => step.parcours_id === id && !step.deleted_at)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((step) => ({
      id: `${id}:${step.step_key}`,
      parcours_id: id,
      key: step.step_key,
      label: step.label,
      hint: step.hint ?? null,
      note: step.note ?? null,
      sort_order: step.sort_order,
      is_active: step.is_active !== false,
    }));
  return {
    id,
    name: row.name,
    description: row.description || '',
    locationSlug: locSlugById.get(row.location_id) || '',
    isProvisional: Boolean(row.is_provisional),
    steps,
  };
});

const counts = demoFiches.reduce((acc, fiche) => {
  acc[fiche.category] = (acc[fiche.category] || 0) + 1;
  return acc;
}, {});

if (demoFiches.length !== 64) {
  throw new Error(`Expected 64 fiches, got ${demoFiches.length}`);
}
if (counts.procedure_deroulement !== 48 || counts.formation_technique !== 10 || counts.depannage_bugs !== 6) {
  throw new Error(`Unexpected category counts: ${JSON.stringify(counts)}`);
}
if (piiHits.length) {
  throw new Error(`PII-like content in export:\n${piiHits.join('\n')}`);
}

const header = `// Generated from the read-only live demo export — do not edit by hand.
// Regenerate: node scripts/gen_demo_from_export.mjs
import { ProcedureFiche, QuizQuestionAdmin } from './database.types';
`;

const body = `${header}
export const DEMO_LIVE_FICHES: ProcedureFiche[] = ${ts(demoFiches)};

export const DEMO_QUIZ: QuizQuestionAdmin[] = ${ts(demoQuiz)};

export const DEMO_STEP_FICHE_LINKS: Record<string, string[]> = ${ts(demoLinks)};
`;

const STEP_NAMES = {
  vr_centre_client: 'VR_CENTRE_CLIENT_STEPS',
  chandoline: 'CHANDOLINE_STEPS',
  escape_life_sion: 'ESCAPE_LIFE_SION_STEPS',
  escape_life_sierre: 'ESCAPE_LIFE_SIERRE_STEPS',
};
const stepConsts = demoParcours
  .map((parcours) => {
    const defs = parcours.steps.map(({ key, label, hint, note }) => ({ key, label, hint, note }));
    return `export const ${STEP_NAMES[parcours.id]}: ParcoursStepDef[] = ${ts(defs)};`;
  })
  .join('\n\n');
const parcoursBlock = `// BEGIN DEMO_PARCOURS
${stepConsts}

function withIds(parcoursId: string, defs: ParcoursStepDef[]): ParcoursStep[] {
  return defs.map((def, index) => ({
    ...def,
    id: \`\${parcoursId}:\${def.key}\`,
    parcours_id: parcoursId,
    sort_order: (index + 1) * 10,
    is_active: true,
  }));
}

export const DEMO_PARCOURS: ParcoursDefinition[] = [
  {
    id: 'vr_centre_client',
    name: 'Parcours client VR au centre',
    description: 'Accueil, jeu et débriefing au VR Center',
    locationSlug: 'vr_center',
    isProvisional: false,
    steps: withIds('vr_centre_client', VR_CENTRE_CLIENT_STEPS),
  },
  {
    id: 'chandoline',
    name: 'Parcours Usine de Chandoline',
    description: 'Novasphère : parcours provisoire, à confirmer',
    locationSlug: 'chandoline',
    isProvisional: true,
    steps: withIds('chandoline', CHANDOLINE_STEPS),
  },
  {
    id: 'escape_life_sion',
    name: 'Parcours Escape Life Sion',
    description: 'Da Vinci Code : préparation, animation et rangement',
    locationSlug: 'escape_sion',
    isProvisional: false,
    steps: withIds('escape_life_sion', ESCAPE_LIFE_SION_STEPS),
  },
  {
    id: 'escape_life_sierre',
    name: 'Parcours Escape Life Sierre',
    description: 'Le Feu sacré, version 1 équipe',
    locationSlug: 'escape_sierre',
    isProvisional: false,
    steps: withIds('escape_life_sierre', ESCAPE_LIFE_SIERRE_STEPS),
  },
];
// END DEMO_PARCOURS
`;

const parcoursPath = path.join(ROOT, 'src/lib/parcours.ts');
const parcoursSrc = fs.readFileSync(parcoursPath, 'utf8');
const patched = parcoursSrc.replace(
  /\/\/ BEGIN DEMO_PARCOURS[\s\S]*?\/\/ END DEMO_PARCOURS\n/,
  parcoursBlock
);
if (patched === parcoursSrc) {
  throw new Error('parcours.ts DEMO_PARCOURS markers not found');
}
fs.writeFileSync(parcoursPath, patched);

const outPath = path.join(ROOT, 'src/lib/demoLiveData.ts');
fs.writeFileSync(outPath, body);
console.log(
  JSON.stringify(
    {
      fiches: demoFiches.length,
      counts,
      quiz: demoQuiz.length,
      linkKeys: Object.keys(demoLinks).length,
      skippedLinkKeys: Object.keys(links).filter((key) => !demoLinks[key]).length,
      parcours: demoParcours.map((row) => ({ id: row.id, steps: row.steps.length })),
      out: path.relative(ROOT, outPath),
      bytes: fs.statSync(outPath).size,
    },
    null,
    2
  )
);
