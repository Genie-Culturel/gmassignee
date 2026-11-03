import { LegacyVrStep, FicheCategory, ChecklistType, IncidentType } from './database.types';

/** Fallback labels for legacy VR step keys (current labels live in parcours_steps). */
export const SESSION_STEP_LABELS: Record<LegacyVrStep, string> = {
  reception_seating: 'Installation au lobby',
  reception_drinks: 'Boissons',
  reception_popcorn: 'Pop-corn',
  reception_checkin: 'Check-in QR',
  salon_briefing: 'Briefing sécurité',
  salon_lockers: 'Casiers',
  game_playing: 'Jeu en cours',
  game_filming: 'Filmer moments clés',
  salon_return: 'Retour salon',
  reception_debrief: 'Débriefing',
  videos_sent: 'Prise et envoi vidéos',
  google_review: 'Avis Google',
  socials_shared: 'Réseaux sociaux',
  cleaning: 'Nettoyage',
};

export const FICHE_CATEGORY_LABELS: Record<FicheCategory, string> = {
  formation_technique: 'Formation technique',
  procedure_deroulement: 'Procédure et déroulement',
  depannage_bugs: 'Dépannage & bugs',
  equipment_setup: 'Configuration matériel',
  game_launch: 'Lancement des jeux',
  troubleshooting: 'Dépannage',
  cleaning: 'Nettoyage',
  client_experience: 'Expérience client',
  safety: 'Sécurité',
  parcours_client: 'Parcours client',
  other: 'Autre',
};

export const FICHE_CATEGORY_ICONS: Record<FicheCategory, string> = {
  formation_technique: '🔧',
  procedure_deroulement: '📋',
  depannage_bugs: '🐛',
  equipment_setup: '⚙️',
  game_launch: '🎮',
  troubleshooting: '🔧',
  cleaning: '🧹',
  client_experience: '👥',
  safety: '⚠️',
  parcours_client: '👣',
  other: '📄',
};

/** Top-level tabs on the Formations & Procédures page. */
export const FORMATION_PAGE_CATEGORIES: FicheCategory[] = [
  'procedure_deroulement',
  'formation_technique',
  'depannage_bugs',
];

export const CHECKLIST_TYPE_LABELS: Record<ChecklistType, string> = {
  opening: 'Ouverture',
  closing: 'Fermeture',
  weekly_cleaning: 'Ménage hebdomadaire',
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  bug: 'Problème avec le jeu',
  malaise: 'Incident avec un client',
  casse: 'Problème matériel',
  autre: 'Autre incident',
};

// Map incident types to relevant fiche titles for auto-opening
export const INCIDENT_FICHE_MAPPING: Record<IncidentType, string[]> = {
  bug: ['🚧 Dépannage : Bug ou freeze en jeu'],
  malaise: ['Dépannage : Malaise client'],
  casse: ['🚧 Dépannage : Manette ou casque cassé'],
  autre: [],
};

export const PAYMENT_METHOD_LABELS: Record<import('./database.types').PaymentMethod, string> = {
  twint: 'Twint',
  especes: 'Espèces',
  carte: 'Carte',
  facture: 'Facture entreprise',
};

// Bug reporter configuration
export const BUG_REPORTER_BASE_URL = 'https://genie-culturel.github.io/Bug_report_VR/';

export function buildBugReporterUrl(params: {
  game: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  panel: number; // number of players
  gm: string;
  remarks?: string;
  ref: string;
  sessionId?: string; // vr_sessions.id
}): string {
  const searchParams = new URLSearchParams({
    game: params.game,
    date: params.date,
    time: params.time,
    panel: params.panel.toString(),
    gm: params.gm,
    ref: params.ref,
    autostart: '1',
  });

  if (params.sessionId) {
    searchParams.set('session_id', params.sessionId);
  }
  if (params.remarks) {
    searchParams.set('remarks', params.remarks);
  }

  return `${BUG_REPORTER_BASE_URL}?${searchParams.toString()}`;
}
