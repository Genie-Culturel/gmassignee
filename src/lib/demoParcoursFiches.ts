import { ProcedureFiche } from './database.types';

/** Live-export step fiches now live in `DEMO_LIVE_FICHES` / `mockFiches`. Kept empty to avoid duplicates. */
export const DEMO_PARCOURS_FICHES: ProcedureFiche[] = [];

/** Demo step → fiche links, keyed `${parcoursId}:${stepKey}`. */
export { DEMO_STEP_FICHE_LINKS } from './demoLiveData';
