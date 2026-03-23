import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { sendWhatsAppMessage } from "../_shared/evolution-api.ts";

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

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseClient();

    // Auth check: accept Supabase JWT or custom API key
    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("CONFIRMATION_API_KEY");

    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API key if provided
    if (apiKey && expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Supabase JWT if using authorization header
    if (authHeader && !apiKey) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse request
    const { appointment_id, action } = await req.json();

    if (!appointment_id || !action) {
      return new Response(
        JSON.stringify({ error: "Missing appointment_id or action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action !== "confirm" && action !== "cancel") {
      return new Response(
        JSON.stringify({ error: "Action must be 'confirm' or 'cancel'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch appointment
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointment_id)
      .single();

    if (fetchError || !appointment) {
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update status
    const newStatus = action === "confirm" ? "confirmed" : "cancelled";
    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      throw updateError;
    }

    // Send WhatsApp notification
    const dateFormatted = formatDateTime(appointment.scheduled_at);

    if (action === "confirm") {
      await sendWhatsAppMessage(
        appointment.patient_phone,
        `✅ Sua consulta em ${dateFormatted} foi confirmada!\n\nAté lá! Se precisar de algo, estou por aqui.`
      );
    } else {
      await sendWhatsAppMessage(
        appointment.patient_phone,
        `❌ Sua consulta em ${dateFormatted} foi cancelada.\n\nPara reagendar, envie "oi" a qualquer momento.`
      );
    }

    return new Response(JSON.stringify({ ok: true, appointment: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Confirmation handler error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
