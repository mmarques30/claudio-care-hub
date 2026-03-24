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
