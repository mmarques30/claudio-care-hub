export type ConversationState =
  | "inicio"
  | "menu_principal"
  | "menu_profissional"
  | "duvidas"
  | "agendamento"
  | "pausado";

export interface TempData {
  patient_name?: string;
  reason?: string;
  appointment_id?: string;
}

export interface StateTransitionResult {
  reply: string;
  newState: ConversationState;
  tempData: TempData;
}

export interface ConversationRow {
  id: string;
  phone_number: string;
  current_state: string;
  temp_data: TempData | null;
  takeover_until: string | null;
  last_bot_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// Z-API webhook payload format
export interface ZApiWebhookPayload {
  phone: string;
  body: string;
  fromMe: boolean;
  isGroup: boolean;
}

export interface CalendlyWebhookPayload {
  event: string;
  payload: {
    name: string;
    email: string;
    scheduled_event: {
      uri: string;
      start_time: string;
      end_time: string;
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
    tracking?: {
      utm_source?: string;
    };
  };
}
