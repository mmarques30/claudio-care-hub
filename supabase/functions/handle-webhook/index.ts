import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";
import { EvolutionWebhookPayload, ConversationRow } from "../_shared/types.ts";
import { processMessage, getBotConfig, formatDateTime } from "./state-machine.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const payload: EvolutionWebhookPayload = await req.json();

    if (payload.event !== "messages.upsert") {
      return jsonResponse({ ok: true, skipped: "not a message event" });
    }

    const rawJid = payload.data.key.remoteJid;

    if (rawJid.includes("@g.us")) {
      return jsonResponse({ ok: true, skipped: "group message" });
    }

    const phone = rawJid.replace("@s.whatsapp.net", "");
    const supabase = getSupabaseClient();

    // ── Read takeover duration from bot_config ──
    const config = await getBotConfig(supabase);
    const takeoverMinutes = parseInt(config["takeover_duration_minutes"] || "120");

    // ── fromMe → activate takeover ──
    if (payload.data.key.fromMe) {
      const takeoverUntil = new Date(
        Date.now() + takeoverMinutes * 60 * 1000
      ).toISOString();

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("phone_number", phone)
        .single();

      if (existing) {
        await supabase
          .from("conversations")
          .update({ takeover_until: takeoverUntil })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("conversations")
          .insert({
            phone_number: phone,
            takeover_until: takeoverUntil,
            current_state: "pausado",
          });
      }

      console.log(`Takeover activated for ${phone} until ${takeoverUntil}`);
      return jsonResponse({ ok: true, action: "takeover_activated" });
    }

    // ── Extract message text and contact name ──
    const messageText =
      payload.data.message?.conversation ??
      payload.data.message?.extendedTextMessage?.text ??
      null;
    const pushName = payload.data.pushName;

    if (!messageText) {
      await sendWhatsAppMessage(
        phone,
        "Desculpe, no momento só consigo processar mensagens de texto. Por favor, envie uma mensagem escrita. 😊"
      );
      return jsonResponse({ ok: true, skipped: "non-text message" });
    }

    // ── Lookup or create conversation ──
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (!conversation) {
      const { data: newConv, error: insertError } = await supabase
        .from("conversations")
        .insert({ phone_number: phone })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating conversation:", insertError);
        throw insertError;
      }
      conversation = newConv;
    }

    const conv = conversation as ConversationRow;

    // ── Check human takeover ──
    if (conv.takeover_until) {
      const takeoverEnd = new Date(conv.takeover_until);
      if (takeoverEnd > new Date()) {
        console.log(`Bot paused for ${phone} until ${conv.takeover_until}`);
        return jsonResponse({ ok: true, skipped: "bot_paused" });
      }
    }

    // ── Check pending appointment awaiting confirmation ──
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
      const trimmed = messageText.trim();

      if (trimmed === "1") {
        // ── CONFIRM appointment (Zapier handles Google Calendar) ──
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
          })
          .eq("id", conv.id);

        return jsonResponse({ ok: true, action: "appointment_confirmed" });
      }

      if (trimmed === "2") {
        // ── CANCEL appointment (Zapier handles Google Calendar) ──
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
          })
          .eq("id", conv.id);

        return jsonResponse({ ok: true, action: "appointment_rescheduled" });
      }
    }

    // ── State machine ──
    const result = await processMessage(conv, messageText.trim(), supabase, pushName);

    const updatePayload: Record<string, unknown> = {
      current_state: result.newState,
      last_bot_message_at: new Date().toISOString(),
    };

    if (result.newState === "pausado") {
      const takeoverUntil = new Date(
        Date.now() + takeoverMinutes * 60 * 1000
      ).toISOString();
      updatePayload.takeover_until = takeoverUntil;
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update(updatePayload)
      .eq("id", conv.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
    }

    if (result.reply) {
      await sendWhatsAppMessage(phone, result.reply);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return jsonResponse({ ok: false, error: "internal error" });
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
