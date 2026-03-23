import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ConversationRow,
  ConversationState,
  TempData,
  StateTransitionResult,
} from "../_shared/types.ts";

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

async function getBotConfig(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const { data } = await supabase.from("bot_config").select("key, value");
  const config: Record<string, string> = {};
  if (data) {
    for (const row of data) {
      config[row.key] = row.value;
    }
  }
  return config;
}

// --- State Handlers ---

function handleInicio(
  config: Record<string, string>,
  pushName?: string
): StateTransitionResult {
  const greeting = pushName ? `Olá, ${pushName}!` : "Olá!";
  const welcomeMsg =
    config["welcome_message"] ??
    "Bem-vindo(a) ao consultório do Dr. Cláudio - Fisioterapia. 👋";

  return {
    reply: `${greeting} ${welcomeMsg}\n\nComo posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional`,
    newState: "menu_principal",
    tempData: {},
  };
}

function handleMenuPrincipal(
  text: string,
  conv: ConversationRow,
  config: Record<string, string>
): StateTransitionResult {
  const normalized = text.toLowerCase().trim();

  if (normalized === "1" || normalized.includes("pessoal")) {
    const personalMsg =
      config["personal_message"] ??
      "Para assuntos pessoais, o Dr. Cláudio irá responder pessoalmente.";

    return {
      reply: `${personalMsg}\n\nO Dr. Cláudio irá responder em breve. Aguarde, por favor. 🙏`,
      newState: "pausado",
      tempData: {},
    };
  }

  if (normalized === "2" || normalized.includes("profissional")) {
    const profMenu =
      config["professional_menu"] ??
      "Menu Profissional:";

    return {
      reply: `${profMenu}\n\n1️⃣ Agendar consulta\n2️⃣ Informações sobre serviços\n3️⃣ Falar com o Dr. Cláudio`,
      newState: "menu_profissional",
      tempData: {},
    };
  }

  return {
    reply: "Desculpe, não entendi. Escolha uma opção:\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
    newState: "menu_principal",
    tempData: (conv.temp_data as TempData) ?? {},
  };
}

function handleMenuProfissional(
  text: string,
  conv: ConversationRow,
  config: Record<string, string>
): StateTransitionResult {
  const normalized = text.toLowerCase().trim();

  if (normalized === "1" || normalized.includes("agendar")) {
    return {
      reply: "Ótimo! Vamos agendar sua consulta.\n\nPor favor, me informe seu nome completo:",
      newState: "agendamento_nome",
      tempData: {},
    };
  }

  if (
    normalized === "2" ||
    normalized.includes("info") ||
    normalized.includes("serviço") ||
    normalized.includes("servico")
  ) {
    const servicesInfo =
      config["services_info"] ??
      "Oferecemos atendimento em fisioterapia ortopédica, esportiva e respiratória.";

    return {
      reply: `${servicesInfo}\n\nDeseja algo mais?\n\n1️⃣ Agendar consulta\n2️⃣ Informações sobre serviços\n3️⃣ Falar com o Dr. Cláudio`,
      newState: "menu_profissional",
      tempData: {},
    };
  }

  if (
    normalized === "3" ||
    normalized.includes("claudio") ||
    normalized.includes("cláudio") ||
    normalized.includes("falar")
  ) {
    return {
      reply: "Certo! O Dr. Cláudio irá responder sua mensagem em breve. Aguarde, por favor. 🙏",
      newState: "pausado",
      tempData: {},
    };
  }

  if (normalized === "voltar" || normalized === "menu") {
    return {
      reply: "Como posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
      newState: "menu_principal",
      tempData: {},
    };
  }

  return {
    reply: "Desculpe, não entendi. Escolha uma opção:\n\n1️⃣ Agendar consulta\n2️⃣ Informações sobre serviços\n3️⃣ Falar com o Dr. Cláudio\n\nOu envie \"voltar\" para o menu anterior.",
    newState: "menu_profissional",
    tempData: (conv.temp_data as TempData) ?? {},
  };
}

function handleAgendamentoNome(
  text: string
): StateTransitionResult {
  return {
    reply: `Obrigado, ${text}! Qual o motivo da consulta?`,
    newState: "agendamento_dia",
    tempData: { patient_name: text },
  };
}

async function handleAgendamentoDia(
  text: string,
  conv: ConversationRow,
  supabase: SupabaseClient,
  config: Record<string, string>
): Promise<StateTransitionResult> {
  const tempData = (conv.temp_data as TempData) ?? {};
  const calendlyLink = config["calendly_link"] ?? "https://calendly.com";

  return {
    reply: `Entendi! Para agendar sua consulta de fisioterapia, acesse o link abaixo e escolha o melhor horário:\n\n📅 ${calendlyLink}\n\nAssim que você agendar, eu te aviso aqui! Se precisar voltar ao menu, envie "voltar".`,
    newState: "agendamento_hora",
    tempData: { ...tempData, reason: text },
  };
}

function handleAgendamentoHora(
  text: string,
  conv: ConversationRow
): StateTransitionResult {
  const normalized = text.toLowerCase().trim();

  if (normalized === "voltar" || normalized === "menu") {
    return {
      reply: "Como posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
      newState: "menu_principal",
      tempData: {},
    };
  }

  return {
    reply: 'Estou aguardando sua marcação pelo link do Calendly. 📅\n\nSe já agendou, em breve você receberá a confirmação aqui. Se precisar voltar ao menu, envie "voltar".',
    newState: "agendamento_hora",
    tempData: (conv.temp_data as TempData) ?? {},
  };
}

function handleDuvidas(
  text: string,
  config: Record<string, string>
): StateTransitionResult {
  const normalized = text.toLowerCase().trim();

  if (normalized === "voltar" || normalized === "menu") {
    return {
      reply: "Como posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
      newState: "menu_principal",
      tempData: {},
    };
  }

  const servicesInfo =
    config["services_info"] ??
    "Oferecemos atendimento em fisioterapia ortopédica, esportiva e respiratória.";

  return {
    reply: `${servicesInfo}\n\nEnvie "voltar" para o menu principal.`,
    newState: "duvidas",
    tempData: {},
  };
}

function handlePausado(): StateTransitionResult {
  return {
    reply: "O Dr. Cláudio irá responder em breve. Aguarde, por favor. 🙏",
    newState: "pausado",
    tempData: {},
  };
}

// --- Main State Machine ---

export async function processMessage(
  conv: ConversationRow,
  messageText: string,
  supabase: SupabaseClient,
  pushName?: string
): Promise<StateTransitionResult> {
  const state = conv.current_state as ConversationState;
  const config = await getBotConfig(supabase);

  // Read takeover duration from config for human takeover states
  const takeoverMinutes = parseInt(config["takeover_duration_minutes"] ?? "120", 10);

  switch (state) {
    case "inicio":
      return handleInicio(config, pushName);

    case "menu_principal":
      return handleMenuPrincipal(messageText, conv, config);

    case "menu_profissional":
      return handleMenuProfissional(messageText, conv, config);

    case "agendamento_nome":
      return handleAgendamentoNome(messageText);

    case "agendamento_dia":
      return handleAgendamentoDia(messageText, conv, supabase, config);

    case "agendamento_hora":
      return handleAgendamentoHora(messageText, conv);

    case "duvidas":
      return handleDuvidas(messageText, config);

    case "pausado":
      return handlePausado();

    default:
      console.warn(`Unknown state "${state}" for conversation ${conv.id}`);
      return {
        reply: "Desculpe, algo deu errado. Vamos recomeçar.\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
        newState: "menu_principal",
        tempData: {},
      };
  }
}

export function getTakeoverMinutes(config: Record<string, string>): number {
  return parseInt(config["takeover_duration_minutes"] ?? "120", 10);
}
