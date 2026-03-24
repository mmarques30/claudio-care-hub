import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";
import { ZApiWebhookPayload, ConversationRow } from "../_shared/types.ts";
import { processMessage, getBotConfig, formatDateTime } from "./state-machine.ts";

const TAKEOVER_HOURS = 2;

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const payload: ZApiWebhookPayload = await req.json();
    const { phone, body, fromMe, isGroup } = payload;

    // ── 1. Ignorar mensagens de grupo ──
    if (isGroup) {
      return jsonResponse({ ok: true, skipped: "group_message" });
    }

    if (!phone) {
      return jsonResponse({ ok: false, error: "missing phone" }, 400);
    }

    const supabase = getSupabaseClient();
    const config = await getBotConfig(supabase);

    // ── 2. fromMe → Cláudio respondeu pelo celular → ativar takeover ──
    if (fromMe) {
      const takeoverUntil = new Date(
        Date.now() + TAKEOVER_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("phone_number", phone)
        .single();

      if (existing) {
        await supabase
          .from("conversations")
          .update({
            takeover_until: takeoverUntil,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("conversations").insert({
          phone_number: phone,
          current_state: "pausado",
          takeover_until: takeoverUntil,
        });
      }

      console.log(`Takeover activated for ${phone} until ${takeoverUntil}`);
      return jsonResponse({ ok: true, action: "takeover_activated" });
    }

    // ── 3. Buscar ou criar conversa pelo phone ──
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (!conversation) {
      const { data: newConv, error: insertError } = await supabase
        .from("conversations")
        .insert({ phone_number: phone, current_state: "inicio" })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating conversation:", insertError);
        throw insertError;
      }
      conversation = newConv;
    }

    const conv = conversation as ConversationRow;

    // ── 4. Se takeover_until > now → bot pausado ──
    if (conv.takeover_until) {
      const takeoverEnd = new Date(conv.takeover_until);
      if (takeoverEnd > new Date()) {
        console.log(`Bot paused for ${phone} until ${conv.takeover_until}`);
        return jsonResponse({ ok: true, skipped: "bot_paused" });
      }
    }

    const messageText = (body ?? "").trim();

    // ── Mensagem não-texto (vazia) ──
    if (!messageText) {
      await sendWhatsAppMessage(
        phone,
        "Desculpe, no momento só consigo processar mensagens de texto. Por favor, envie uma mensagem escrita. 😊"
      );
      return jsonResponse({ ok: true, skipped: "non_text_message" });
    }

    // ── 5. Verificar appointment pendente com lembrete enviado ──
    const { data: pendingAppointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_phone", phone)
      .eq("status", "pending")
      .eq("reminder_sent", true)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .single();

    if (pendingAppointment) {
      if (messageText === "1") {
        // Confirmar consulta
        await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", pendingAppointment.id);

        const dateStr = formatDateTime(pendingAppointment.scheduled_at);
        await sendWhatsAppMessage(
          phone,
          `✅ Confirmado! Nos vemos dia ${dateStr}. 😊`
        );

        await supabase
          .from("conversations")
          .update({
            current_state: "inicio",
            last_bot_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conv.id);

        return jsonResponse({ ok: true, action: "appointment_confirmed" });
      }

      if (messageText === "2") {
        // Remarcar consulta
        await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", pendingAppointment.id);

        const calendlyLink = config["calendly_link"] ?? "https://calendly.com";
        await sendWhatsAppMessage(
          phone,
          `Sem problemas! Clique aqui para escolher um novo horário:\n\n📅 ${calendlyLink}`
        );

        await supabase
          .from("conversations")
          .update({
            current_state: "inicio",
            last_bot_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conv.id);

        return jsonResponse({ ok: true, action: "appointment_rescheduled" });
      }
    }

    // ── 6. State machine ──
    const result = await processMessage(conv, messageText, supabase);

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      current_state: result.newState,
      last_bot_message_at: now,
      updated_at: now,
    };

    // Se vai para pausado, ativar takeover
    if (result.newState === "pausado") {
      updatePayload.takeover_until = new Date(
        Date.now() + TAKEOVER_HOURS * 60 * 60 * 1000
      ).toISOString();
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update(updatePayload)
      .eq("id", conv.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
    }

    // ── 7. Enviar resposta via Z-API ──
    if (result.reply) {
      await sendWhatsAppMessage(phone, result.reply);
    }

    return jsonResponse({ ok: true, state: result.newState });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
