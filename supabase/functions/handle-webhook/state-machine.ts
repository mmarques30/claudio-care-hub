import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ConversationRow,
  ConversationState,
  TempData,
  StateTransitionResult,
} from "../_shared/types.ts";

const MENU_TEXT = `Como posso te ajudar? Escolha uma opção:

1️⃣ Agendar consulta
2️⃣ Confirmar consulta
3️⃣ Cancelar consulta
4️⃣ Falar com o Dr. Cláudio`;

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

async function getCalendlyLink(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from("bot_config")
    .select("value")
    .eq("key", "calendly_link")
    .single();

  return data?.value ?? "https://calendly.com";
}

// --- State Handlers ---

function handleInicio(): StateTransitionResult {
  return {
    reply: `Olá! Bem-vindo(a) ao consultório do Dr. Cláudio - Fisioterapia. 👋\n\n${MENU_TEXT}`,
    newState: "menu",
    tempData: {},
  };
}

function handleMenu(
  text: string,
  conv: ConversationRow,
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "1" || normalized.includes("agendar")) {
    return Promise.resolve({
      reply: "Ótimo! Vamos agendar sua consulta.\n\nPor favor, me informe seu nome completo:",
      newState: "awaiting_name",
      tempData: {},
    });
  }

  if (normalized === "2" || normalized.includes("confirmar")) {
    return handleListAppointments(conv.phone_number, "confirming", supabase);
  }

  if (normalized === "3" || normalized.includes("cancelar")) {
    return handleListAppointments(conv.phone_number, "cancelling", supabase);
  }

  if (
    normalized === "4" ||
    normalized.includes("claudio") ||
    normalized.includes("cláudio") ||
    normalized.includes("falar")
  ) {
    return Promise.resolve({
      reply:
        "Certo! O Dr. Cláudio irá responder sua mensagem em breve. Aguarde, por favor. 🙏",
      newState: "human_takeover",
      tempData: {},
    });
  }

  return Promise.resolve({
    reply: `Desculpe, não entendi sua resposta.\n\n${MENU_TEXT}`,
    newState: "menu",
    tempData: (conv.temp_data as TempData) ?? {},
  });
}

async function handleListAppointments(
  phone: string,
  targetState: "confirming" | "cancelling",
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const statusFilter = targetState === "confirming" ? "pending" : "pending,confirmed";
  const statuses = statusFilter.split(",");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_phone", phone)
    .in("status", statuses)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (!appointments || appointments.length === 0) {
    const actionLabel = targetState === "confirming" ? "confirmar" : "cancelar";
    return {
      reply: `Você não tem consultas pendentes para ${actionLabel}.\n\n${MENU_TEXT}`,
      newState: "menu",
      tempData: {},
    };
  }

  const list = appointments
    .map(
      (apt, i) =>
        `${i + 1}️⃣ ${formatDateTime(apt.scheduled_at)} - Status: ${apt.status}`
    )
    .join("\n");

  const actionLabel =
    targetState === "confirming" ? "confirmar" : "cancelar";

  return {
    reply: `Suas próximas consultas:\n\n${list}\n\nEnvie o número da consulta que deseja ${actionLabel}, ou "voltar" para o menu.`,
    newState: targetState,
    tempData: {
      appointment_id: appointments.length === 1 ? appointments[0].id : undefined,
    },
  };
}

function handleAwaitingName(
  text: string,
  conv: ConversationRow
): StateTransitionResult {
  return {
    reply: `Obrigado, ${text}! Agora me conte: qual o motivo da consulta?`,
    newState: "awaiting_reason",
    tempData: { name: text },
  };
}

async function handleAwaitingReason(
  text: string,
  conv: ConversationRow,
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const tempData = (conv.temp_data as TempData) ?? {};
  const calendlyLink = await getCalendlyLink(supabase);

  return {
    reply: `Entendi! Para agendar sua consulta de fisioterapia, acesse o link abaixo e escolha o melhor horário:\n\n📅 ${calendlyLink}\n\nAssim que você agendar, eu te aviso aqui! Se precisar voltar ao menu, envie "voltar".`,
    newState: "scheduling",
    tempData: { ...tempData, reason: text },
  };
}

function handleScheduling(
  text: string,
  conv: ConversationRow
): StateTransitionResult {
  const normalized = text.toLowerCase().trim();

  if (normalized === "voltar" || normalized === "menu") {
    return {
      reply: `Sem problemas!\n\n${MENU_TEXT}`,
      newState: "menu",
      tempData: {},
    };
  }

  return {
    reply:
      'Estou aguardando sua marcação pelo link do Calendly. 📅\n\nSe já agendou, em breve você receberá a confirmação aqui. Se precisar voltar ao menu, envie "voltar".',
    newState: "scheduling",
    tempData: (conv.temp_data as TempData) ?? {},
  };
}

async function handleConfirming(
  text: string,
  conv: ConversationRow,
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "voltar" || normalized === "nao" || normalized === "não") {
    return {
      reply: `Ok!\n\n${MENU_TEXT}`,
      newState: "menu",
      tempData: {},
    };
  }

  // Try to parse appointment selection
  const selection = parseInt(normalized, 10);
  if (isNaN(selection)) {
    return {
      reply: 'Envie o número da consulta que deseja confirmar, ou "voltar" para o menu.',
      newState: "confirming",
      tempData: (conv.temp_data as TempData) ?? {},
    };
  }

  // Fetch pending appointments to find the selected one
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_phone", conv.phone_number)
    .eq("status", "pending")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (!appointments || selection < 1 || selection > appointments.length) {
    return {
      reply: "Número inválido. Tente novamente ou envie \"voltar\".",
      newState: "confirming",
      tempData: (conv.temp_data as TempData) ?? {},
    };
  }

  const appointment = appointments[selection - 1];

  const { error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointment.id);

  if (error) {
    console.error("Error confirming appointment:", error);
    return {
      reply: "Ocorreu um erro ao confirmar. Tente novamente mais tarde.",
      newState: "menu",
      tempData: {},
    };
  }

  return {
    reply: `✅ Consulta confirmada!\n\n📅 ${formatDateTime(appointment.scheduled_at)}\n\nNos vemos lá! Se precisar de algo mais:\n\n${MENU_TEXT}`,
    newState: "menu",
    tempData: {},
  };
}

async function handleCancelling(
  text: string,
  conv: ConversationRow,
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "voltar") {
    return {
      reply: `Ok!\n\n${MENU_TEXT}`,
      newState: "menu",
      tempData: {},
    };
  }

  const selection = parseInt(normalized, 10);
  if (isNaN(selection)) {
    return {
      reply: 'Envie o número da consulta que deseja cancelar, ou "voltar" para o menu.',
      newState: "cancelling",
      tempData: (conv.temp_data as TempData) ?? {},
    };
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_phone", conv.phone_number)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (!appointments || selection < 1 || selection > appointments.length) {
    return {
      reply: "Número inválido. Tente novamente ou envie \"voltar\".",
      newState: "cancelling",
      tempData: (conv.temp_data as TempData) ?? {},
    };
  }

  const appointment = appointments[selection - 1];

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointment.id);

  if (error) {
    console.error("Error cancelling appointment:", error);
    return {
      reply: "Ocorreu um erro ao cancelar. Tente novamente mais tarde.",
      newState: "menu",
      tempData: {},
    };
  }

  return {
    reply: `❌ Consulta de ${formatDateTime(appointment.scheduled_at)} foi cancelada.\n\nSe quiser reagendar, é só me dizer!\n\n${MENU_TEXT}`,
    newState: "menu",
    tempData: {},
  };
}

function handleHumanTakeover(): StateTransitionResult {
  return {
    reply: "O Dr. Cláudio irá responder em breve. Aguarde, por favor. 🙏",
    newState: "human_takeover",
    tempData: {},
  };
}

// --- Main State Machine ---

export async function processMessage(
  conv: ConversationRow,
  messageText: string,
  supabase: SupabaseClient
): Promise<StateTransitionResult> {
  const state = conv.current_state as ConversationState;

  switch (state) {
    case "inicio":
      return handleInicio();

    case "menu":
      return handleMenu(messageText, conv, supabase);

    case "awaiting_name":
      return handleAwaitingName(messageText, conv);

    case "awaiting_reason":
      return handleAwaitingReason(messageText, conv, supabase);

    case "scheduling":
      return handleScheduling(messageText, conv);

    case "confirming":
      return handleConfirming(messageText, conv, supabase);

    case "cancelling":
      return handleCancelling(messageText, conv, supabase);

    case "human_takeover":
      return handleHumanTakeover();

    default:
      // Unknown state — reset to menu
      console.warn(`Unknown state "${state}" for conversation ${conv.id}`);
      return {
        reply: `Desculpe, algo deu errado. Vamos recomeçar.\n\n${MENU_TEXT}`,
        newState: "menu",
        tempData: {},
      };
  }
}
