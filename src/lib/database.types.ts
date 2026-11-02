export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ChecklistType = 'opening' | 'closing' | 'weekly_cleaning';
export type FicheCategory = 'formation_technique' | 'procedure_deroulement' | 'equipment_setup' | 'game_launch' | 'troubleshooting' | 'cleaning' | 'client_experience' | 'safety' | 'parcours_client' | 'other';
export type IncidentType = 'bug' | 'malaise' | 'casse' | 'autre';
export type PaymentMethod = 'twint' | 'especes' | 'carte' | 'facture';

export type SessionStep =
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

export interface ProcedureFiche {
  id: string;
  category: FicheCategory;
  title: string;
  summary: string | null;
  content_steps: Array<{ order: number; text: string; completed?: boolean }>;
  is_placeholder: boolean;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
          event_id: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
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
          created_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      checklist_type: ChecklistType;
      fiche_category: FicheCategory;
      session_step: SessionStep;
      incident_type: IncidentType;
      payment_method: PaymentMethod;
    };
  };
}
