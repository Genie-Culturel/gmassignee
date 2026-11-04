export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** GMassignee enums in Lovable Supabase (gh_ prefix). */
export type ChecklistType = 'opening' | 'closing' | 'weekly_cleaning';
export type FicheCategory =
  | 'formation_technique'
  | 'procedure_deroulement'
  | 'depannage_bugs'
  | 'equipment_setup'
  | 'game_launch'
  | 'troubleshooting'
  | 'cleaning'
  | 'client_experience'
  | 'safety'
  | 'parcours_client'
  | 'other';
export type IncidentType = 'bug' | 'malaise' | 'casse' | 'autre';
export type PaymentMethod = 'twint' | 'especes' | 'carte' | 'facture';
export type FicheScopeKind = 'all' | 'locations' | 'games';

/** User role in the Lovable app (public.user_roles.role, enum app_role). */
export type AppRole = 'admin' | 'gm' | 'stock_manager' | 'planificateur';

/** Historical VR Center step keys (former Postgres enum session_step). */
export type LegacyVrStep =
  | 'reception_seating'
  | 'reception_drinks'
  | 'reception_popcorn'
  | 'reception_checkin'
  | 'salon_briefing'
  | 'salon_lockers'
  | 'game_playing'
  | 'game_filming'
  | 'salon_return'
  | 'reception_debrief'
  | 'videos_sent'
  | 'google_review'
  | 'socials_shared'
  | 'cleaning';

/** One point of a fiche. `images`: optional public URLs (screenshots/photos). */
export interface FicheStep {
  order: number;
  text: string;
  completed?: boolean;
  images?: string[];
}

/** Step key of any parcours (parcours_steps.step_key). VR keys = LegacyVrStep. */
export type SessionStep = string;

export interface ProcedureFiche {
  id: string;
  category: FicheCategory;
  title: string;
  summary: string | null;
  content_steps: Array<FicheStep>;
  is_placeholder: boolean;
  tags: string[] | null;
  is_active: boolean;
  version?: number;
  is_required?: boolean;
  skip_version_bump?: boolean;
  deleted_at?: string | null;
  sort_order?: number;
  scope_kind?: FicheScopeKind;
  /** Sous-catégorie d'affichage : null = Général, sinon slug de lieu (ou escape_life). */
  sub_group?: string | null;
  scope_location_ids?: string[];
  scope_game_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestionPublic {
  id: string;
  fiche_id: string;
  prompt: string;
  choices: QuizChoice[];
  order_index: number;
  is_example: boolean;
}

export interface QuizQuestionAdmin extends QuizQuestionPublic {
  correct_choice_ids: string[];
}

export interface FicheValidation {
  id?: string;
  gm_id: string;
  fiche_id: string;
  version: number;
  validated_at: string;
}

export interface SalesProduct {
  id: string;
  name: string;
  unit_price: number;
  category: string | null;
  description: string | null;
  min_quantity: number | null;
  max_quantity: number | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SessionSale {
  id: string;
  session_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  payment_method: PaymentMethod;
  is_invoiced: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BugSession {
  id: string;
  ref: string | null;
  vr_session_id: string | null;
  game: string;
  session_date: string;
  session_time: string | null;
  panel: string | null;
  gm: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface BugEntry {
  id: string;
  bug_session_id: string;
  description: string;
  criticality: string | null;
  category: string | null;
  position: number | null;
  status: string | null;
  extra: Json;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      gh_procedure_fiches: {
        Row: ProcedureFiche;
        Insert: Omit<ProcedureFiche, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProcedureFiche, 'id' | 'created_at' | 'updated_at'>>;
      };
      gh_sales_products: {
        Row: SalesProduct;
        Insert: Omit<SalesProduct, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SalesProduct, 'id' | 'created_at' | 'updated_at'>>;
      };
      gh_session_sales: {
        Row: SessionSale;
        Insert: Omit<SessionSale, 'id' | 'line_total' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SessionSale, 'id' | 'line_total' | 'created_at' | 'updated_at'>>;
      };
      gh_gm_checkins: {
        Row: {
          id: string;
          gm_id: string;
          event_id: string | null;
          checkin_time: string;
          expected_time: string | null;
          is_late: boolean | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gm_id: string;
          event_id?: string | null;
          checkin_time?: string;
          expected_time?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gm_id?: string;
          event_id?: string | null;
          checkin_time?: string;
          expected_time?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      gh_checklist_templates: {
        Row: {
          id: string;
          type: ChecklistType;
          title: string;
          description: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ChecklistType;
          title: string;
          description?: string | null;
          order_index: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: ChecklistType;
          title?: string;
          description?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      gh_checklist_template_fiches: {
        Row: {
          id: string;
          template_id: string;
          fiche_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          fiche_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          fiche_id?: string;
          created_at?: string;
        };
      };
      gh_checklist_completions: {
        Row: {
          id: string;
          template_id: string;
          gm_id: string;
          date: string;
          completed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          gm_id: string;
          date: string;
          completed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          gm_id?: string;
          date?: string;
          completed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      gh_vr_sessions: {
        Row: {
          id: string;
          event_id: string | null;
          gm_id: string;
          started_at: string;
          ended_at: string | null;
          group_name: string | null;
          notes: string | null;
          has_incident: boolean;
          incident_type: IncidentType | null;
          incident_details: string | null;
          total_collected: number | null;
          total_to_invoice: number | null;
          sales_comment: string | null;
          game: string | null;
          session_date: string | null;
          session_time: string | null;
          player_count: number | null;
          parcours_id: string | null;
          assignment_id: string | null;
          gm_name: string | null;
          client_email: string | null;
          videos_sent_at: string | null;
          videos_download_token: string;
          flag_reviewed_at: string | null;
          flag_reviewed_by: string | null;
          is_manual: boolean;
          planned_end_time: string | null;
          planning_activity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          gm_id: string;
          started_at?: string;
          ended_at?: string | null;
          group_name?: string | null;
          notes?: string | null;
          has_incident?: boolean;
          incident_type?: IncidentType | null;
          incident_details?: string | null;
          total_collected?: number | null;
          total_to_invoice?: number | null;
          sales_comment?: string | null;
          game?: string | null;
          session_date?: string | null;
          session_time?: string | null;
          player_count?: number | null;
          parcours_id?: string | null;
          assignment_id?: string | null;
          gm_name?: string | null;
          client_email?: string | null;
          videos_sent_at?: string | null;
          videos_download_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          gm_id?: string;
          started_at?: string;
          ended_at?: string | null;
          group_name?: string | null;
          notes?: string | null;
          has_incident?: boolean;
          incident_type?: IncidentType | null;
          incident_details?: string | null;
          total_collected?: number | null;
          total_to_invoice?: number | null;
          sales_comment?: string | null;
          game?: string | null;
          session_date?: string | null;
          session_time?: string | null;
          player_count?: number | null;
          parcours_id?: string | null;
          assignment_id?: string | null;
          gm_name?: string | null;
          client_email?: string | null;
          videos_sent_at?: string | null;
          videos_download_token?: string;
          created_at?: string;
        };
      };
      gh_session_media: {
        Row: {
          id: string;
          session_id: string;
          path: string;
          original_name: string | null;
          size: number;
          mime: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          path: string;
          original_name?: string | null;
          size?: number;
          mime?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          path?: string;
          original_name?: string | null;
          size?: number;
          mime?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          expires_at?: string;
        };
      };
      gh_session_steps: {
        Row: {
          id: string;
          session_id: string;
          step: SessionStep;
          completed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          step: SessionStep;
          completed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          step?: SessionStep;
          completed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      gh_session_step_fiches: {
        Row: {
          id: string;
          step: SessionStep;
          fiche_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          step: SessionStep;
          fiche_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          step?: SessionStep;
          fiche_id?: string;
          created_at?: string;
        };
      };
      gh_bug_sessions: {
        Row: BugSession;
        Insert: Omit<BugSession, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BugSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      gh_bug_entries: {
        Row: BugEntry;
        Insert: Omit<BugEntry, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BugEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      gh_locations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      gh_games: {
        Row: {
          id: string;
          name: string;
          location_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      gh_parcours: {
        Row: {
          id: string;
          name: string;
          location_slug: string | null;
          is_default: boolean;
          is_provisional: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location_slug?: string | null;
          is_default?: boolean;
          is_provisional?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location_slug?: string | null;
          is_default?: boolean;
          is_provisional?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      gh_parcours_steps: {
        Row: {
          id: string;
          parcours_id: string;
          step_key: string;
          label: string;
          hint: string | null;
          note: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parcours_id: string;
          step_key: string;
          label: string;
          hint?: string | null;
          note?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parcours_id?: string;
          step_key?: string;
          label?: string;
          hint?: string | null;
          note?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      gh_fiche_validations: {
        Row: FicheValidation;
        Insert: Omit<FicheValidation, 'id' | 'validated_at'> & {
          id?: string;
          validated_at?: string;
        };
        Update: Partial<Omit<FicheValidation, 'id'>>;
      };
      gh_fiche_scope_locations: {
        Row: {
          id: string;
          fiche_id: string;
          location_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fiche_id: string;
          location_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fiche_id?: string;
          location_id?: string;
          created_at?: string;
        };
      };
      gh_fiche_scope_games: {
        Row: {
          id: string;
          fiche_id: string;
          game_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fiche_id: string;
          game_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fiche_id?: string;
          game_id?: string;
          created_at?: string;
        };
      };
      gh_quiz_questions: {
        Row: {
          id: string;
          fiche_id: string;
          prompt: string;
          correct_choice_ids: string[];
          order_index: number;
          is_example: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fiche_id: string;
          prompt: string;
          correct_choice_ids: string[];
          order_index: number;
          is_example?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fiche_id?: string;
          prompt?: string;
          correct_choice_ids?: string[];
          order_index?: number;
          is_example?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      gh_get_quiz_questions: {
        Args: { p_fiche_id: string };
        Returns: QuizQuestionPublic[];
      };
      gh_submit_fiche_validation: {
        Args: { p_gm_id: string; p_fiche_id: string; p_version: number };
        Returns: void;
      };
      gh_list_gm_profiles: {
        Args: Record<string, never>;
        Returns: { gm_id: string; display_name: string }[];
      };
      gh_set_session_flag_reviewed: {
        Args: { p_session_id: string; p_reviewer_id: string };
        Returns: void;
      };
      gh_admin_delete_session: {
        Args: { p_session_id: string };
        Returns: void;
      };
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
    };
    Enums: {
      gh_checklist_type: ChecklistType;
      gh_fiche_category: FicheCategory;
      gh_incident_type: IncidentType;
      gh_payment_method: PaymentMethod;
      gh_session_step: string;
    };
  };
}
