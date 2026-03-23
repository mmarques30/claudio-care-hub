export type ConversationState =
  | "inicio"
  | "menu_principal"
  | "menu_profissional"
  | "duvidas"
  | "agendamento_nome"
  | "agendamento_dia"
  | "agendamento_hora"
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

export interface EvolutionWebhookPayload {
  event: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
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
