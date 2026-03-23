import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";
import { CalendlyWebhookPayload, TempData } from "../_shared/types.ts";

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

async function verifyCalendlySignature(
  req: Request,
  body: string
): Promise<boolean> {
  const secret = Deno.env.get("CALENDLY_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("CALENDLY_WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }

  const signature = req.headers.get("Calendly-Webhook-Signature");
  if (!signature) return false;

  // Calendly signature format: t=timestamp,v1=signature
  const parts: Record<string, string> = {};
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=");
    parts[key] = value;
  }

  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return v1 === expectedSignature;
}

function extractPhoneFromCalendly(
  payload: CalendlyWebhookPayload["payload"]
): string | null {
  // Primary: look in questions_and_answers for phone
  if (payload.questions_and_answers) {
    for (const qa of payload.questions_and_answers) {
      const q = qa.question.toLowerCase();
      if (
        q.includes("telefone") ||
        q.includes("phone") ||
        q.includes("whatsapp") ||
        q.includes("celular")
      ) {
        // Clean phone: keep only digits
        const phone = qa.answer.replace(/\D/g, "");
        if (phone.length >= 10) return phone;
      }
    }
  }

  // Secondary: check UTM source
  if (payload.tracking?.utm_source) {
    const phone = payload.tracking.utm_source.replace(/\D/g, "");
    if (phone.length >= 10) return phone;
  }

  return null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const bodyText = await req.text();

    // Verify Calendly signature
    const isValid = await verifyCalendlySignature(req, bodyText);
    if (!isValid) {
      console.error("Invalid Calendly webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data: CalendlyWebhookPayload = JSON.parse(bodyText);

    // Only process invitee.created events
    if (data.event !== "invitee.created") {
      return new Response(JSON.stringify({ ok: true, skipped: "not invitee.created" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, scheduled_event } = data.payload;
    const scheduledAt = scheduled_event.start_time;
    const eventUri = scheduled_event.uri;

    const supabase = getSupabaseClient();

    // Try to extract phone from Calendly payload
    let phone = extractPhoneFromCalendly(data.payload);

    // Fallback: find conversation in "scheduling" state matching by name
    if (!phone) {
      console.log(
        `No phone in Calendly payload for ${name}. Searching conversations in scheduling state...`
      );

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("current_state", "scheduling");

      if (conversations && conversations.length > 0) {
        // Try to match by name in temp_data
        const match = conversations.find((c) => {
          const td = c.temp_data as TempData | null;
          return (
            td?.name &&
            td.name.toLowerCase().trim() === name.toLowerCase().trim()
          );
        });

        if (match) {
          phone = match.phone_number;
          console.log(`Found matching conversation for ${name}: ${phone}`);
        } else if (conversations.length === 1) {
          // Only one conversation in scheduling state — use it
          phone = conversations[0].phone_number;
          console.log(
            `Single scheduling conversation found, using: ${phone}`
          );
        }
      }
    }

    if (!phone) {
      console.error(
        `Could not determine phone number for Calendly invitee: ${name}`
      );
      return new Response(
        JSON.stringify({ ok: false, error: "Could not determine phone number" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create appointment
    const { error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_phone: phone,
        patient_name: name,
        scheduled_at: scheduledAt,
        status: "pending",
        calendar_event_id: eventUri,
      });

    if (appointmentError) {
      console.error("Error creating appointment:", appointmentError);
      throw appointmentError;
    }

    // Update conversation state
    const { error: convError } = await supabase
      .from("conversations")
      .update({
        current_state: "menu",
        temp_data: null,
      })
      .eq("phone_number", phone);

    if (convError) {
      console.error("Error updating conversation:", convError);
    }

    // Send WhatsApp confirmation
    const dateFormatted = formatDateTime(scheduledAt);
    await sendWhatsAppMessage(
      phone,
      `✅ Agendamento recebido!\n\n📅 ${dateFormatted}\n👤 ${name}\n\nPara confirmar sua presença, envie "confirmar". Se precisar cancelar ou reagendar, me avise!\n\nDigite qualquer coisa para ver o menu.`
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Calendly webhook error:", error);
    return new Response(JSON.stringify({ ok: false, error: "internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
