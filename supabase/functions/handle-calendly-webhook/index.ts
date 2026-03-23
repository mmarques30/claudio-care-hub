import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";
import { CalendlyWebhookPayload } from "../_shared/types.ts";

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

  const parts: Record<string, string> = {};
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=");
    parts[key] = value;
  }

  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  // Reject signatures older than 3 minutes to prevent replay attacks
  const tolerance = 3 * 60 * 1000;
  const signatureAge = Date.now() - parseInt(timestamp, 10) * 1000;
  if (signatureAge > tolerance) {
    console.error("Calendly webhook signature too old");
    return false;
  }

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
  if (payload.questions_and_answers) {
    for (const qa of payload.questions_and_answers) {
      const q = qa.question.toLowerCase();
      if (
        q.includes("telefone") ||
        q.includes("phone") ||
        q.includes("whatsapp") ||
        q.includes("celular")
      ) {
        const phone = qa.answer.replace(/\D/g, "");
        if (phone.length >= 10) return phone;
      }
    }
  }

  if (payload.tracking?.utm_source) {
    const phone = payload.tracking.utm_source.replace(/\D/g, "");
    if (phone.length >= 10) return phone;
  }

  return null;
}

async function notifyN8n(
  envKey: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = Deno.env.get(envKey);
  if (!webhookUrl) {
    console.warn(`${envKey} not configured — skipping n8n notification`);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`n8n webhook error (${envKey}): status=${response.status} body=${body}`);
    } else {
      console.log(`n8n notified (${envKey}) successfully`);
    }
  } catch (err) {
    console.error(`Failed to call n8n webhook (${envKey}):`, err);
  }
}

async function getBotConfig(
  supabase: ReturnType<typeof getSupabaseClient>
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

// ── Main Handler ──

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const bodyText = await req.text();

    // Verify Calendly signature
    const isValid = await verifyCalendlySignature(req, bodyText);
    if (!isValid) {
      console.error("Invalid Calendly webhook signature");
      return jsonResponse({ error: "Invalid signature" }, 403);
    }

    const data: CalendlyWebhookPayload = JSON.parse(bodyText);
    const supabase = getSupabaseClient();

    // ── INVITEE CREATED (new appointment) ──
    if (data.event === "invitee.created") {
      return await handleInviteeCreated(data, supabase);
    }

    // ── INVITEE CANCELED ──
    if (data.event === "invitee.canceled") {
      return await handleInviteeCanceled(data, supabase);
    }

    // Unknown event — acknowledge
    return jsonResponse({ ok: true, skipped: `unhandled event: ${data.event}` });
  } catch (error) {
    console.error("Calendly webhook error:", error);
    return jsonResponse({ ok: false, error: "internal error" });
  }
});

// ── invitee.created ──

async function handleInviteeCreated(
  data: CalendlyWebhookPayload,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<Response> {
  const { name, email, scheduled_event } = data.payload;
  const scheduledAt = scheduled_event.start_time;
  const eventUri = scheduled_event.uri;

  // Extract phone from Calendly Q&A or UTM
  let phone = extractPhoneFromCalendly(data.payload);

  // Fallback: search conversations in scheduling-related states
  if (!phone) {
    console.log(`No phone in Calendly payload for ${name}. Searching conversations...`);

    const { data: conversations } = await supabase
      .from("conversations")
      .select("phone_number, temp_data")
      .in("current_state", ["agendamento_hora", "agendamento_dia", "agendamento_nome", "menu_profissional"]);

    if (conversations && conversations.length > 0) {
      const match = conversations.find((c) => {
        const td = c.temp_data as { patient_name?: string } | null;
        return (
          td?.patient_name &&
          td.patient_name.toLowerCase().trim() === name.toLowerCase().trim()
        );
      });

      if (match) {
        phone = match.phone_number;
        console.log(`Found matching conversation for ${name}: ${phone}`);
      } else if (conversations.length === 1) {
        phone = conversations[0].phone_number;
        console.log(`Single scheduling conversation found, using: ${phone}`);
      }
    }
  }

  if (!phone) {
    console.error(`Could not determine phone for Calendly invitee: ${name} (${email})`);
    return jsonResponse({ ok: false, error: "Could not determine phone number" });
  }

  // Extract reason from Q&A if available
  let reason: string | null = null;
  if (data.payload.questions_and_answers) {
    for (const qa of data.payload.questions_and_answers) {
      const q = qa.question.toLowerCase();
      if (q.includes("motivo") || q.includes("reason") || q.includes("assunto")) {
        reason = qa.answer;
        break;
      }
    }
  }

  // Save appointment to DB
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      patient_phone: phone,
      patient_name: name,
      reason,
      scheduled_at: scheduledAt,
      status: "pending",
      calendar_event_id: eventUri,
    })
    .select()
    .single();

  if (appointmentError) {
    console.error("Error creating appointment:", appointmentError);
    throw appointmentError;
  }

  // POST to n8n → create Google Calendar event
  await notifyN8n("N8N_NEW_APPOINTMENT_WEBHOOK", {
    appointment_id: appointment.id,
    patient_phone: phone,
    patient_name: name,
    patient_email: email,
    reason,
    scheduled_at: scheduledAt,
    calendly_event_uri: eventUri,
  });

  // Update conversation state back to inicio
  await supabase
    .from("conversations")
    .update({
      current_state: "inicio",
      temp_data: null,
      last_bot_message_at: new Date().toISOString(),
    })
    .eq("phone_number", phone);

  // Send WhatsApp confirmation
  const dateFormatted = formatDateTime(scheduledAt);
  await sendWhatsAppMessage(
    phone,
    `✅ Horário reservado! Você tem consulta dia ${dateFormatted}.\n\nVocê receberá um lembrete 24h antes para confirmar. 😊`
  );

  console.log(`Appointment created for ${name} (${phone}) at ${scheduledAt}`);
  return jsonResponse({ ok: true, action: "appointment_created", appointment_id: appointment.id });
}

// ── invitee.canceled ──

async function handleInviteeCanceled(
  data: CalendlyWebhookPayload,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<Response> {
  const { name, email, scheduled_event } = data.payload;
  const eventUri = scheduled_event.uri;

  // Find appointment by calendar_event_id
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("calendar_event_id", eventUri)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !appointment) {
    // Try finding by name + scheduled_at as fallback
    const phone = extractPhoneFromCalendly(data.payload);
    if (phone) {
      const { data: fallback } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_phone", phone)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .single();

      if (fallback) {
        return await cancelAppointment(fallback, supabase);
      }
    }

    console.error(`Appointment not found for canceled event: ${eventUri} (${name})`);
    return jsonResponse({ ok: false, error: "Appointment not found" });
  }

  return await cancelAppointment(appointment, supabase);
}

async function cancelAppointment(
  appointment: Record<string, unknown>,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<Response> {
  const phone = appointment.patient_phone as string;
  const appointmentId = appointment.id as string;

  // Update status to cancelled
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (updateError) {
    console.error("Error cancelling appointment:", updateError);
    throw updateError;
  }

  // POST to n8n → update Google Calendar (red)
  await notifyN8n("N8N_CANCEL_WEBHOOK", {
    appointment_id: appointmentId,
    calendar_event_id: appointment.calendar_event_id,
    patient_phone: phone,
    patient_name: appointment.patient_name,
    scheduled_at: appointment.scheduled_at,
    colorId: "11",
  });

  // Get calendly_link from bot_config
  const config = await getBotConfig(supabase);
  const calendlyLink = config["calendly_link"] ?? "https://calendly.com";

  // Send WhatsApp notification
  await sendWhatsAppMessage(
    phone,
    `Seu agendamento foi cancelado.\n\nSe quiser remarcar, acesse o link abaixo:\n\n📅 ${calendlyLink}`
  );

  // Reset conversation state
  await supabase
    .from("conversations")
    .update({
      current_state: "inicio",
      temp_data: null,
      last_bot_message_at: new Date().toISOString(),
    })
    .eq("phone_number", phone);

  console.log(`Appointment ${appointmentId} cancelled for ${phone}`);
  return jsonResponse({ ok: true, action: "appointment_cancelled", appointment_id: appointmentId });
}

// ── Helpers ──

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
