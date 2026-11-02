import { SessionStep } from './database.types';

/**
 * A parcours is a step-by-step GM flow for a venue / game type.
 *
 * Only "Parcours client VR au centre" ships today. Add more entries here
 * (EscapeLife Sion, EscapeLife Sierre, Chandoline, …) when their steps
 * are ready — no UI rewrite needed if they follow this shape.
 */
export interface ParcoursDefinition {
  id: string;
  name: string;
  description: string;
  /** Venue key for future filtering (vr_center, escape_life_sion, …). */
  venue: string;
  steps: SessionStep[];
}

export const VR_CENTRE_CLIENT_STEPS: SessionStep[] = [
  'reception_seating',
  'reception_drinks',
  'reception_popcorn',
  'reception_checkin',
  'salon_briefing',
  'salon_lockers',
  'game_playing',
  'game_filming',
  'salon_return',
  'reception_debrief',
  'videos_sent',
  'google_review',
  'socials_shared',
  'cleaning',
];

export const PARCOURS: ParcoursDefinition[] = [
  {
    id: 'vr_centre_client',
    name: 'Parcours client VR au centre',
    description: 'Accueil, jeu et débriefing au VR Center (14 étapes)',
    venue: 'vr_center',
    steps: VR_CENTRE_CLIENT_STEPS,
  },
  // Future parcours (do not add yet):
  // { id: 'escape_life_sion', name: 'EscapeLife Sion', ... }
  // { id: 'escape_life_sierre', name: 'EscapeLife Sierre', ... }
  // { id: 'chandoline', name: 'Chandoline', ... }
];

export const DEFAULT_PARCOURS_ID = 'vr_centre_client';

export function getParcoursById(id: string): ParcoursDefinition | undefined {
  return PARCOURS.find((p) => p.id === id);
}

export function getParcoursOrDefault(id?: string | null): ParcoursDefinition {
  return (id && getParcoursById(id)) || getParcoursById(DEFAULT_PARCOURS_ID)!;
}
