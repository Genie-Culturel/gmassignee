import { isMockMode, supabase } from './supabase';

export const GM_OPTIONS_ROW_ID = 'default';
export const GM_OPTIONS_STORAGE_KEY = 'gmassignee_gm_options';

export interface GmOptions {
  showSuiviParties: boolean;
  showFormations: boolean;
  formationsObligatoires: boolean;
  notifications: boolean;
  uploadVideosClients: boolean;
  bugReporter: boolean;
  encaissement: boolean;
}

export type GmOptionKey = keyof GmOptions;

/** Conservative defaults: Suivi + Formations hidden until Julien enables them. */
export const DEFAULT_GM_OPTIONS: GmOptions = {
  showSuiviParties: false,
  showFormations: false,
  formationsObligatoires: true,
  notifications: true,
  uploadVideosClients: true,
  bugReporter: true,
  encaissement: true,
};

export const GM_OPTION_FIELDS: {
  key: GmOptionKey;
  column: string;
  label: string;
  hint: string;
}[] = [
  {
    key: 'showSuiviParties',
    column: 'show_suivi_parties',
    label: 'Afficher Suivi parties',
    hint: 'Onglet / bouton Suivi parties visible pour les GMs.',
  },
  {
    key: 'showFormations',
    column: 'show_formations',
    label: 'Afficher Formations et procédures',
    hint: 'Onglet Formations et procédures visible pour les GMs.',
  },
  {
    key: 'formationsObligatoires',
    column: 'formations_obligatoires',
    label: 'Formations obligatoires',
    hint: 'Si désactivé, les GMs ne sont pas forcés de valider les fiches requises.',
  },
  {
    key: 'notifications',
    column: 'notifications',
    label: 'Notifications',
    hint: 'Onglet Notifications du dashboard GM (Lovable). N’arrête pas les e-mails ni les webhooks.',
  },
  {
    key: 'uploadVideosClients',
    column: 'upload_videos_clients',
    label: 'Upload vidéos clients',
    hint: 'Bloc souvenirs / envoi vidéo dans le suivi de session.',
  },
  {
    key: 'bugReporter',
    column: 'bug_reporter',
    label: 'Bug reporter',
    hint: 'Boutons pour ouvrir le Bug reporter depuis le suivi.',
  },
  {
    key: 'encaissement',
    column: 'encaissement',
    label: 'Encaissement / ventes',
    hint: 'Bloc ventes et encaissement dans le suivi de session.',
  },
];

type GmOptionsRow = {
  id: string;
  show_suivi_parties: boolean;
  show_formations: boolean;
  formations_obligatoires: boolean;
  notifications: boolean;
  upload_videos_clients: boolean;
  bug_reporter: boolean;
  encaissement: boolean;
};

function rowToOptions(row: GmOptionsRow): GmOptions {
  return {
    showSuiviParties: row.show_suivi_parties,
    showFormations: row.show_formations,
    formationsObligatoires: row.formations_obligatoires,
    notifications: row.notifications,
    uploadVideosClients: row.upload_videos_clients,
    bugReporter: row.bug_reporter,
    encaissement: row.encaissement,
  };
}

function readDemoOptions(): GmOptions {
  try {
    const raw = window.localStorage.getItem(GM_OPTIONS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GM_OPTIONS };
    return { ...DEFAULT_GM_OPTIONS, ...(JSON.parse(raw) as Partial<GmOptions>) };
  } catch {
    return { ...DEFAULT_GM_OPTIONS };
  }
}

function writeDemoOptions(options: GmOptions) {
  try {
    window.localStorage.setItem(GM_OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {
    /* ignore */
  }
}

export async function fetchGmOptions(): Promise<GmOptions> {
  if (isMockMode || !supabase) return readDemoOptions();
  const { data, error } = await supabase
    .from('gh_gm_options')
    .select(
      'id, show_suivi_parties, show_formations, formations_obligatoires, notifications, upload_videos_clients, bug_reporter, encaissement'
    )
    .eq('id', GM_OPTIONS_ROW_ID)
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_GM_OPTIONS };
  return rowToOptions(data as GmOptionsRow);
}

let demoWriteChain: Promise<GmOptions> = Promise.resolve(DEFAULT_GM_OPTIONS);

export async function updateGmOption(key: GmOptionKey, value: boolean): Promise<GmOptions> {
  const field = GM_OPTION_FIELDS.find((item) => item.key === key);
  if (!field) throw new Error('Option inconnue');

  if (isMockMode || !supabase) {
    const run = async () => {
      const next = { ...readDemoOptions(), [key]: value };
      writeDemoOptions(next);
      return next;
    };
    const result = demoWriteChain.then(run, run);
    demoWriteChain = result;
    return result;
  }

  const { data, error } = await supabase
    .from('gh_gm_options')
    .update({ [field.column]: value, updated_by: (await supabase.auth.getUser()).data.user?.id ?? null })
    .eq('id', GM_OPTIONS_ROW_ID)
    .select(
      'id, show_suivi_parties, show_formations, formations_obligatoires, notifications, upload_videos_clients, bug_reporter, encaissement'
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Impossible d’enregistrer l’option');
  }
  return rowToOptions(data as GmOptionsRow);
}
