import type { VenueCatalog, VenueGame } from './venues';

/**
 * A parcours is the step-by-step GM checklist of one location.
 * Source of truth: tables `parcours` + `parcours_steps` (migration 018),
 * editable in Admin → Parcours. The constants below are the in-code
 * fallback (demo mode, or when the tables cannot be read).
 */

/** Step as shown in a session (also what vr_sessions.steps_snapshot stores). */
export interface ParcoursStepDef {
  key: string;
  label: string;
  hint: string | null;
  /** Optional condition shown as a badge, e.g. « Option Vinum ». */
  note: string | null;
}

export interface ParcoursStep extends ParcoursStepDef {
  id: string;
  parcours_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface ParcoursDefinition {
  id: string;
  name: string;
  description: string;
  /** locations.slug (vr_center, escape_sion, escape_sierre, chandoline). */
  locationSlug: string;
  isProvisional: boolean;
  /** Sorted by sort_order. Includes inactive steps (not soft-deleted ones). */
  steps: ParcoursStep[];
}

export const DEFAULT_PARCOURS_ID = 'vr_centre_client';
/** Step that drives the client video upload UI. */
export const VIDEO_STEP_KEY = 'videos_sent';

export const LOCATION_PARCOURS_ID: Record<string, string> = {
  vr_center: 'vr_centre_client',
  escape_sion: 'escape_life_sion',
  escape_sierre: 'escape_life_sierre',
  chandoline: 'chandoline',
};

const STEP_KEY_PREFIX: Record<string, string> = {
  vr_centre_client: 'vr',
  escape_life_sion: 'sion',
  escape_life_sierre: 'sierre',
  chandoline: 'nova',
};

// BEGIN DEMO_PARCOURS
export const VR_CENTRE_CLIENT_STEPS: ParcoursStepDef[] = [
  {
    "key": "lobby_setup",
    "label": "Setup du lobby",
    "hint": "Avant l'arrivée des clients : porte ouverte 15 min avant, bar prêt, stocks et propreté contrôlés.",
    "note": null
  },
  {
    "key": "room_prep",
    "label": "Préparer la salle",
    "hint": "Choisir la halle (A de préférence), allumer les lumières, fermer les fenêtres, allumer les casques.",
    "note": null
  },
  {
    "key": "reception_popcorn",
    "label": "Pop-corn & boissons",
    "hint": "Après le jeu, au lobby : pop-corn offert et service des boissons par le GM au frigo. Tout encaisser par Twint avant le départ.",
    "note": null
  },
  {
    "key": "reception_seating",
    "label": "Accueil au salon",
    "hint": "Accueillir le groupe directement au salon, faire connaissance, puis check-in.",
    "note": null
  },
  {
    "key": "reception_checkin",
    "label": "Check-in QR",
    "hint": "Chaque client scanne le QR « CHECK IN » (consentement individuel aux CG). Annoncer le tournage des vidéos.",
    "note": null
  },
  {
    "key": "game_intro",
    "label": "Présentation du jeu",
    "hint": "Brief court : pitch du jeu en quelques phrases. Les explications et détails viennent au débriefing.",
    "note": null
  },
  {
    "key": "salon_briefing",
    "label": "Briefing sécurité",
    "hint": "Consignes de sécurité au salon (TV) : « les 10 commandements de la VR ».",
    "note": null
  },
  {
    "key": "salon_lockers",
    "label": "Casiers",
    "hint": "Vestes, pulls, sacs et appareils électroniques dans les casiers. S'habiller léger.",
    "note": null
  },
  {
    "key": "hall_equipment",
    "label": "Équipement en halle",
    "hint": "Amener le groupe en halle de jeu et l'équiper (Meta Quest 3, manettes).",
    "note": null
  },
  {
    "key": "game_playing",
    "label": "Jeu en cours",
    "hint": "Comment animer et accompagner les clients pendant qu'ils jouent",
    "note": null
  },
  {
    "key": "game_filming",
    "label": "Filmer moments clés",
    "hint": "Filmer les moments forts. Partie et équipe cool → prévenir Luna (story).",
    "note": null
  },
  {
    "key": "hall_unequip",
    "label": "Déséquipement",
    "hint": "Retirer les casques doucement, puis poser casques et controllers sur les supports.",
    "note": null
  },
  {
    "key": "salon_return",
    "label": "Retour au lobby",
    "hint": "Casiers, puis table au lobby : 5 min pour reprendre ses esprits, le GM sert les boissons.",
    "note": null
  },
  {
    "key": "reception_debrief",
    "label": "Débriefing",
    "hint": "Vrai débriefing, plus fourni : impressions, puis les infos du jeu et du studio pas données au début.",
    "note": null
  },
  {
    "key": "videos_sent",
    "label": "Envoi vidéos / photos",
    "hint": "Envoyer les vidéos et photos au client avec le module « Vidéos & photos souvenirs » (supprimées après 14 jours). Le groupe en est informé au check-in.",
    "note": null
  },
  {
    "key": "google_review",
    "label": "Avis Google",
    "hint": "Inviter à laisser un avis Google (affiche avec QR code).",
    "note": null
  },
  {
    "key": "cleaning",
    "label": "Nettoyage de la salle",
    "hint": "Nettoyer casques et controllers, recharger les batteries, contrôler le matériel.",
    "note": null
  },
  {
    "key": "closing",
    "label": "Nettoyage et fermeture",
    "hint": "Relever les boissons, nettoyer et ranger lobby, salon et cuisine, éteindre et verrouiller.",
    "note": null
  }
];

export const CHANDOLINE_STEPS: ParcoursStepDef[] = [
  {
    "key": "nova_site_prep",
    "label": "Préparation sur site",
    "hint": "Arriver en avance, ouvrir, allumer et tester l'installation XR.",
    "note": "À confirmer"
  },
  {
    "key": "nova_welcome",
    "label": "Accueil du groupe",
    "hint": "Accueillir le groupe à l'usine (rue de la Dixence 76, Sion).",
    "note": "À confirmer"
  },
  {
    "key": "nova_checkin",
    "label": "Check-in QR",
    "hint": "Consentement individuel aux CG. Annoncer le tournage des vidéos.",
    "note": "À confirmer"
  },
  {
    "key": "nova_safety",
    "label": "Briefing sécurité",
    "hint": "Consignes de sécurité propres à une usine réelle (zones, commandes).",
    "note": "À confirmer"
  },
  {
    "key": "nova_equipment",
    "label": "Équipement",
    "hint": "Équiper les joueurs (casques XR).",
    "note": "À confirmer"
  },
  {
    "key": "nova_playing",
    "label": "Jeu en cours",
    "hint": "Animer la mission (45 min).",
    "note": "À confirmer"
  },
  {
    "key": "videos_sent",
    "label": "Prise et envoi vidéos",
    "hint": "Filmer 2 vidéos et les envoyer par e-mail via l'app.",
    "note": "À confirmer"
  },
  {
    "key": "nova_debrief",
    "label": "Débriefing",
    "hint": "Débriefer le groupe.",
    "note": "À confirmer"
  },
  {
    "key": "nova_google_review",
    "label": "Avis Google",
    "hint": "Inviter à laisser un avis Google.",
    "note": "À confirmer"
  },
  {
    "key": "nova_socials",
    "label": "Réseaux sociaux",
    "hint": "Inviter à suivre et à taguer nos réseaux.",
    "note": "À confirmer"
  },
  {
    "key": "nova_closing",
    "label": "Rangement et extinction",
    "hint": "Nettoyer le matériel, éteindre l'installation, fermer.",
    "note": "À confirmer"
  }
];

export const ESCAPE_LIFE_SION_STEPS: ParcoursStepDef[] = [
  {
    "key": "sion_booking_info",
    "label": "Infos de la réservation",
    "hint": "La veille au plus tard, dans GMassignee : nombre de joueurs, option « 1 équipe », langue, options, notes admin.",
    "note": null
  },
  {
    "key": "sion_stock_arrival",
    "label": "Arrivée au stock",
    "hint": "Être au lieu de stockage 45 min à 1 h avant l'heure de la réservation.",
    "note": null
  },
  {
    "key": "sion_game_material",
    "label": "Matériel du jeu",
    "hint": "Éléments dans la langue du client, 1 sac par équipe, téléphone d'animation, clés.",
    "note": null
  },
  {
    "key": "sion_vinum_material",
    "label": "Matériel Vinum",
    "hint": "Verres, bouteilles, cadenas, porte-verres, tire-bouchons. Respecter les quantités.",
    "note": "Option Vinum"
  },
  {
    "key": "sion_prepare_stages",
    "label": "Préparer les étapes",
    "hint": "Sac client à la 1re étape, lumière, éléments, cadenas verrouillés, appareils branchés et testés.",
    "note": null
  },
  {
    "key": "sion_couvent_start",
    "label": "Mise en route Couvent",
    "hint": "Brancher, beamer allumé tout de suite, capteurs verts, ARM, test PIR, RESET, escalier, ARM.",
    "note": null
  },
  {
    "key": "sion_meeting_point",
    "label": "Accueil au rendez-vous",
    "hint": "Rendez-vous au lieu de préparation (provisoire). Accueillir le groupe et briefer les équipes.",
    "note": null
  },
  {
    "key": "sion_animation",
    "label": "Animation 4DGames",
    "hint": "Animer sur 4dgames.ch avec le téléphone d'animation. Indices subtils, ne pas dépasser la durée max.",
    "note": null
  },
  {
    "key": "sion_team_tracking",
    "label": "Suivi des équipes",
    "hint": "Contact perdu → « Localiser » le sac de l'équipe, sinon appeler un responsable.",
    "note": null
  },
  {
    "key": "sion_end_script",
    "label": "Script de fin",
    "hint": "Expliquer le Chrisme et l'acte de contrition (Schiner contre Supersaxo), plus les fun facts.",
    "note": null
  },
  {
    "key": "sion_google_review",
    "label": "Avis Google",
    "hint": "Inviter à laisser un avis Google, sauf si les clients n'ont pas apprécié.",
    "note": null
  },
  {
    "key": "sion_collect_material",
    "label": "Récupérer le matériel",
    "hint": "Reprendre tous les éléments de jeu auprès des joueurs.",
    "note": null
  },
  {
    "key": "sion_tidy_rooms",
    "label": "Ranger les salles",
    "hint": "Remettre en état, déchets, dégâts, cadenas ouverts dans les boîtes, éteindre, débrancher, fermer à clé.",
    "note": null
  },
  {
    "key": "sion_couvent_stop",
    "label": "Arrêt Couvent",
    "hint": "Beamer éteint (2 pressions), attendre l'extinction, débrancher la prise derrière l'harmonium.",
    "note": null
  },
  {
    "key": "sion_vinum_glasses",
    "label": "Vinum : verres et vins",
    "hint": "Bouteilles jetées en chemin (sauf 21 h–7 h et 12 h–13 h → bac de la cave). Séparer verres sales et propres.",
    "note": "Option Vinum"
  },
  {
    "key": "sion_stock_return",
    "label": "Retour au stock",
    "hint": "Matériel à sa place (étiquettes), sacs vidés, téléphone et batteries en charge, défauts signalés.",
    "note": null
  }
];

export const ESCAPE_LIFE_SIERRE_STEPS: ParcoursStepDef[] = [
  {
    "key": "sierre_booking_info",
    "label": "Infos de la réservation",
    "hint": "La veille : nombre de joueurs et d'équipes, langue, options, notes admin.",
    "note": null
  },
  {
    "key": "sierre_stock_arrival",
    "label": "Arrivée au stock",
    "hint": "Être au lieu de stockage 45 min à 1 h avant la réservation.",
    "note": null
  },
  {
    "key": "sierre_game_material",
    "label": "Matériel du jeu",
    "hint": "Éléments dans la bonne langue, 1 sac par équipe, téléphone d'animation, clés (+ vin si option).",
    "note": null
  },
  {
    "key": "sierre_prepare_cave",
    "label": "Préparer Cave des Vidômes",
    "hint": "Sac client, lumière, éléments, cadenas verrouillés, appareils branchés et testés.",
    "note": null
  },
  {
    "key": "sierre_prepare_villa",
    "label": "Préparer Château Villa",
    "hint": "Même préparation qu'à la Cave.",
    "note": null
  },
  {
    "key": "sierre_meeting_point",
    "label": "Accueil au rendez-vous",
    "hint": "Rue du Bourg 24, devant le Château des Vidômes.",
    "note": null
  },
  {
    "key": "sierre_game_start",
    "label": "Début du jeu",
    "hint": "Lancer l'animation sur 4dgames.ch (téléphone). Cave 60 min, NDDM 10, Mercier 40, Villa 20.",
    "note": null
  },
  {
    "key": "sierre_team_tracking",
    "label": "Suivi des équipes",
    "hint": "Indices subtils, durée max. Contact perdu → « Localiser » le sac, sinon appeler un responsable.",
    "note": null
  },
  {
    "key": "sierre_tidy_cave",
    "label": "Ranger Cave des Vidômes",
    "hint": "Après le passage de l'équipe : remise en état, cadenas ouverts, éteindre, débrancher, fermer.",
    "note": null
  },
  {
    "key": "sierre_final_villa",
    "label": "Final au Château Villa",
    "hint": "Faire la fin du jeu à la Villa.",
    "note": null
  },
  {
    "key": "sierre_google_review",
    "label": "Avis Google",
    "hint": "Inviter à laisser un avis Google, sauf si les clients n'ont pas apprécié.",
    "note": null
  },
  {
    "key": "sierre_tidy_villa",
    "label": "Ranger Château Villa",
    "hint": "Remise en état, déchets, cadenas ouverts, éteindre, débrancher, fermer à clé.",
    "note": null
  },
  {
    "key": "sierre_medallions",
    "label": "Ramener les médaillons",
    "hint": "Rapporter les médaillons à la Cave des Vidômes.",
    "note": null
  },
  {
    "key": "sierre_stock_return",
    "label": "Retour au stock",
    "hint": "Matériel à sa place, sacs vidés, téléphone et batteries en charge, défauts signalés.",
    "note": null
  }
];

function withIds(parcoursId: string, defs: ParcoursStepDef[]): ParcoursStep[] {
  return defs.map((def, index) => ({
    ...def,
    id: `${parcoursId}:${def.key}`,
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

export function activeSteps(parcours: ParcoursDefinition | undefined): ParcoursStepDef[] {
  if (!parcours) return [];
  return parcours.steps
    .filter((step) => step.is_active)
    .map(({ key, label, hint, note }) => ({ key, label, hint, note }));
}

export function getParcoursById(list: ParcoursDefinition[], id?: string | null): ParcoursDefinition | undefined {
  if (!id) return undefined;
  return list.find((parcours) => parcours.id === id);
}

export function getParcoursOrDefault(list: ParcoursDefinition[], id?: string | null): ParcoursDefinition {
  return (
    getParcoursById(list, id) ||
    getParcoursById(list, DEFAULT_PARCOURS_ID) ||
    getParcoursById(DEMO_PARCOURS, id) ||
    DEMO_PARCOURS[0]
  );
}

export function parcoursForLocationSlug(
  list: ParcoursDefinition[],
  locationSlug: string | undefined
): ParcoursDefinition | undefined {
  if (!locationSlug) return undefined;
  return (
    list.find((parcours) => parcours.locationSlug === locationSlug) ||
    getParcoursById(list, LOCATION_PARCOURS_ID[locationSlug])
  );
}

/** Game → its location → that location's parcours. */
export function parcoursForGame(
  list: ParcoursDefinition[],
  catalog: VenueCatalog,
  game: VenueGame | undefined
): ParcoursDefinition | undefined {
  if (!game) return undefined;
  const location = catalog.locations.find((item) => item.id === game.location_id);
  return parcoursForLocationSlug(list, location?.slug);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Match a free-text game title (planning) to a catalog game. */
export function resolveGameByName(catalog: VenueCatalog, name: string | undefined): VenueGame | undefined {
  if (!name) return undefined;
  const target = normalize(name);
  if (!target) return undefined;
  const exact = catalog.games.find(
    (game) => normalize(game.name) === target || normalize(game.slug) === target
  );
  if (exact) return exact;
  const words = new Set(target.split(' '));
  let best: { game: VenueGame; score: number } | undefined;
  for (const game of catalog.games) {
    const candidates = [normalize(game.name), normalize(game.slug.replace(/_/g, ' '))];
    for (const candidate of candidates) {
      const tokens = candidate.split(' ').filter((token) => token.length > 3);
      const hit =
        target.includes(candidate) || (tokens.length > 0 && tokens.some((token) => words.has(token)));
      if (hit && (!best || candidate.length > best.score)) best = { game, score: candidate.length };
    }
  }
  return best?.game;
}

export function hasVideoStep(steps: Pick<ParcoursStepDef, 'key'>[]): boolean {
  return steps.some((step) => step.key === VIDEO_STEP_KEY);
}

export function newStepKey(parcoursId: string): string {
  const prefix = STEP_KEY_PREFIX[parcoursId] || 'step';
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Live `gh_parcours_steps.id` is a UUID. Demo fallback IDs look like `escape_life_sion:sion_booking_info`. */
export function isParcoursStepRowId(id: string): boolean {
  return UUID_RE.test(id);
}

export function assertParcoursStepWriteResult(
  data: { id: string; is_active?: boolean }[] | null | undefined,
  patch: Partial<Pick<ParcoursStep, 'is_active'>>
) {
  if (!data?.length) {
    throw new Error(
      'Étape : modification non enregistrée (droits insuffisants ou étape introuvable).'
    );
  }
  if (
    patch.is_active !== undefined &&
    typeof data[0].is_active === 'boolean' &&
    data[0].is_active !== patch.is_active
  ) {
    throw new Error('Étape : la case Active n’a pas été enregistrée.');
  }
}
