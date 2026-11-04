export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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

/** Step key of any parcours (parcours_steps.step_key). VR keys = LegacyVrStep. */
export type SessionStep = string;

export interface ProcedureFiche {
  id: string;
  category: FicheCategory;
  title: string;
  summary: string | null;
  content_steps: Array<{ order: number; text: string; completed?: boolean }>;
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
      procedure_fiches: {
        Row: ProcedureFiche;
        Insert: Omit<ProcedureFiche, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProcedureFiche, 'id' | 'created_at' | 'updated_at'>>;
      };
      sales_products: {
        Row: SalesProduct;
        Insert: Omit<SalesProduct, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SalesProduct, 'id' | 'created_at' | 'updated_at'>>;
      };
      session_sales: {
        Row: SessionSale;
        Insert: Omit<SessionSale, 'id' | 'line_total' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SessionSale, 'id' | 'line_total' | 'created_at' | 'updated_at'>>;
      };
      gm_checkins: {
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
      checklist_templates: {
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
      checklist_template_fiches: {
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
      checklist_completions: {
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
      vr_sessions: {
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
      session_media: {
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
      session_steps: {
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
      session_step_fiches: {
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
      bug_sessions: {
        Row: BugSession;
        Insert: Omit<BugSession, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BugSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      bug_entries: {
        Row: BugEntry;
        Insert: Omit<BugEntry, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BugEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      checklist_type: ChecklistType;
      fiche_category: FicheCategory;
      incident_type: IncidentType;
      payment_method: PaymentMethod;
    };
  };
}
