import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";
import { EvolutionWebhookPayload, ConversationRow, TempData } from "../_shared/types.ts";
import { processMessage } from "./state-machine.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const payload: EvolutionWebhookPayload = await req.json();

    // Only process incoming text messages
    if (payload.event !== "messages.upsert") {
      return new Response(JSON.stringify({ ok: true, skipped: "not a message event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore messages sent by the bot itself
    if (payload.data.key.fromMe) {
      return new Response(JSON.stringify({ ok: true, skipped: "own message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract phone number (strip @s.whatsapp.net)
    const rawJid = payload.data.key.remoteJid;
    const phone = rawJid.replace("@s.whatsapp.net", "");

    // Ignore group messages
    if (rawJid.includes("@g.us")) {
      return new Response(JSON.stringify({ ok: true, skipped: "group message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract message text
    const messageText =
      payload.data.message?.conversation ??
      payload.data.message?.extendedTextMessage?.text ??
      null;

    const supabase = getSupabaseClient();

    if (!messageText) {
      // Non-text message — ask for text
      await sendWhatsAppMessage(
        phone,
        "Desculpe, no momento só consigo processar mensagens de texto. Por favor, envie uma mensagem escrita. 😊"
      );
      return new Response(JSON.stringify({ ok: true, skipped: "non-text message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup or create conversation
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

    // Check human takeover
    if (conv.takeover_until) {
      const takeoverEnd = new Date(conv.takeover_until);
      if (takeoverEnd > new Date()) {
        console.log(`Human takeover active for ${phone} until ${conv.takeover_until}`);
        return new Response(JSON.stringify({ ok: true, skipped: "human takeover" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Process through state machine
    const result = await processMessage(conv, messageText.trim(), supabase);

    // Update conversation state
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        current_state: result.newState,
        temp_data: result.tempData as Record<string, unknown>,
        last_bot_message_at: new Date().toISOString(),
      })
      .eq("id", conv.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
    }

    // Send reply
    if (result.reply) {
      await sendWhatsAppMessage(phone, result.reply);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Always return 200 to avoid webhook retries
    return new Response(JSON.stringify({ ok: false, error: "internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
