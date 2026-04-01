import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";
import {
  ConversationRow,
  ConversationState,
  TempData,
  StateTransitionResult,
} from "../_shared/types.ts";

// ── Helpers ──

export function formatDateTime(isoString: string): string {
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

export async function getBotConfig(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("bot_config").select("key, value");
  if (error) {
    console.error("Error loading bot_config:", error);
  }
  const config: Record<string, string> = {};
  if (data) {
    for (const row of data) {
      config[row.key] = row.value;
    }
  }
  return config;
}

// ── Claude Haiku ──

async function askClaudeHaiku(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not configured");
    return "Desculpe, não consegui processar sua mensagem agora. Tente novamente mais tarde.";
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find(
      (block: { type: string }) => block.type === "text"
    );
    return (textBlock as { type: string; text: string })?.text ??
      "Desculpe, não consegui gerar uma resposta.";
  } catch (err) {
    console.error("Claude Haiku error:", err);
    return "Desculpe, estou com dificuldades técnicas. O Dr. Cláudio entrará em contato com você.";
  }
}

// ── State Handlers ──

function handleInicio(
  config: Record<string, string>,
  pushName?: string
): StateTransitionResult {
  const greeting = pushName ? `Olá, ${pushName}! ` : "Olá! ";
  const welcomeMsg =
    config["welcome_message"] ??
    "Bem-vindo(a) ao consultório do Dr. Cláudio - Fisioterapia. 👋\n\nComo posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional";

  return {
    reply: `${greeting}${welcomeMsg}`,
    newState: "menu_principal",
    tempData: {},
  };
}

async function handleMenuPrincipal(
  text: string,
  conv: ConversationRow,
  config: Record<string, string>
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "1") {
    const personalMsg =
      config["personal_message"] ??
      "Para assuntos pessoais, o Dr. Cláudio irá responder pessoalmente. Aguarde, por favor. 🙏";
    return { reply: personalMsg, newState: "pausado", tempData: {} };
  }

  if (normalized === "2") {
    const profMenu =
      config["professional_menu"] ??
      "Menu Profissional:\n\n1️⃣ Dúvidas sobre serviços\n2️⃣ Agendar consulta";
    return { reply: profMenu, newState: "menu_profissional", tempData: {} };
  }

  const servicesInfo = config["services_info"] ?? "";

  const systemPrompt = `Você é o assistente virtual do Dr. Cláudio, fisioterapeuta.
O paciente está no menu principal e deve escolher:
1 - Assunto pessoal
2 - Assunto profissional

O paciente enviou uma mensagem livre em vez de digitar 1 ou 2.
Analise a intenção e responda com EXATAMENTE uma destas ações no início da sua resposta:
[ACAO:1] se o assunto parece pessoal
[ACAO:2] se o assunto parece profissional
[ACAO:MENU] se não conseguir determinar

Depois da tag de ação, escreva uma mensagem curta e amigável ao paciente.
Contexto dos serviços: ${servicesInfo}`;

  const aiResponse = await askClaudeHaiku(systemPrompt, text);

  if (aiResponse.includes("[ACAO:1]")) {
    const personalMsg =
      config["personal_message"] ??
      "Para assuntos pessoais, o Dr. Cláudio irá responder pessoalmente. Aguarde, por favor. 🙏";
    const cleanReply = aiResponse.replace("[ACAO:1]", "").trim();
    return { reply: cleanReply || personalMsg, newState: "pausado", tempData: {} };
  }

  if (aiResponse.includes("[ACAO:2]")) {
    const profMenu =
      config["professional_menu"] ??
      "Menu Profissional:\n\n1️⃣ Dúvidas sobre serviços\n2️⃣ Agendar consulta";
    const cleanReply = aiResponse.replace("[ACAO:2]", "").trim();
    return { reply: `${cleanReply}\n\n${profMenu}`, newState: "menu_profissional", tempData: {} };
  }

  return {
    reply: "Não consegui entender. Por favor, escolha uma opção:\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
    newState: "menu_principal",
    tempData: {},
  };
}

async function handleMenuProfissional(
  text: string,
  conv: ConversationRow,
  config: Record<string, string>
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "1") {
    const servicesInfo =
      config["services_info"] ??
      "Oferecemos atendimento em fisioterapia ortopédica, esportiva e respiratória.";
    const calendlyLink = config["calendly_link"] ?? "https://calendly.com";

    const systemPrompt = buildDuvidasPrompt(servicesInfo, calendlyLink);
    const aiResponse = await askClaudeHaiku(
      systemPrompt,
      "O paciente quer saber sobre os serviços. Apresente um resumo amigável e pergunte em que pode ajudar."
    );

    return {
      reply: `${aiResponse}\n\nDigite *0* ou *voltar* para retornar ao menu.`,
      newState: "duvidas",
      tempData: {},
    };
  }

  if (normalized === "2") {
    const calendlyLink = config["calendly_link"] ?? "https://calendly.com";
    const schedulingMsg =
      config["scheduling_message"] ??
      `Para agendar sua consulta, clique no link abaixo e escolha o melhor horário:\n\n📅 ${calendlyLink}\n\nAssim que você agendar, te aviso aqui! 😊`;

    return { reply: schedulingMsg, newState: "inicio", tempData: {} };
  }

  if (normalized === "voltar" || normalized === "0" || normalized === "menu") {
    return {
      reply: "Como posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
      newState: "menu_principal",
      tempData: {},
    };
  }

  const profMenu =
    config["professional_menu"] ??
    "Menu Profissional:\n\n1️⃣ Dúvidas sobre serviços\n2️⃣ Agendar consulta";

  return {
    reply: `Não entendi. ${profMenu}\n\nDigite *0* para voltar ao menu principal.`,
    newState: "menu_profissional",
    tempData: {},
  };
}

async function handleDuvidas(
  text: string,
  config: Record<string, string>
): Promise<StateTransitionResult> {
  const normalized = text.toLowerCase().trim();

  if (normalized === "0" || normalized === "voltar") {
    return {
      reply: "Como posso te ajudar?\n\n1️⃣ Assunto pessoal\n2️⃣ Assunto profissional",
      newState: "menu_principal",
      tempData: {},
    };
  }

  const servicesInfo =
    config["services_info"] ??
    "Oferecemos atendimento em fisioterapia ortopédica, esportiva e respiratória.";
  const calendlyLink = config["calendly_link"] ?? "https://calendly.com";

  const systemPrompt = buildDuvidasPrompt(servicesInfo, calendlyLink);
  const aiResponse = await askClaudeHaiku(systemPrompt, text);

  return {
    reply: `${aiResponse}\n\nDigite *0* ou *voltar* para retornar ao menu.`,
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

function buildDuvidasPrompt(servicesInfo: string, calendlyLink: string): string {
  return `Você é o assistente virtual do Dr. Cláudio, fisioterapeuta.
Responda de forma amigável, profissional e concisa (máximo 3 parágrafos curtos).
Use emojis com moderação.

Informações sobre os serviços:
${servicesInfo}

Para agendar consulta, o paciente deve acessar: ${calendlyLink}

Se não souber responder algo específico, diga educadamente que o Dr. Cláudio entrará em contato para esclarecer.
Nunca invente informações médicas. Não faça diagnósticos.`;
}

// ── Main State Machine ──

export async function processMessage(
  conv: ConversationRow,
  messageText: string,
  supabase: SupabaseClient,
  pushName?: string
): Promise<StateTransitionResult> {
  const state = conv.current_state as ConversationState;
  const config = await getBotConfig(supabase);

  switch (state) {
    case "inicio":
      return handleInicio(config, pushName);

    case "menu_principal":
      return handleMenuPrincipal(messageText, conv, config);

    case "menu_profissional":
      return handleMenuProfissional(messageText, conv, config);

    case "duvidas":
      return handleDuvidas(messageText, config);

    case "pausado":
      return handlePausado();

    case "agendamento":
      return handleInicio(config, pushName);

    default:
      console.warn(`Unknown state "${state}" for conversation ${conv.id}`);
      return handleInicio(config, pushName);
  }
}
