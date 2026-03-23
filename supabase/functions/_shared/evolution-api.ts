export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<void> {
  const apiUrl = Deno.env.get("EVOLUTION_API_URL");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE");

  if (!apiUrl || !apiKey || !instance) {
    throw new Error(
      "Missing EVOLUTION_API_URL, EVOLUTION_API_KEY, or EVOLUTION_INSTANCE"
    );
  }

  const url = `${apiUrl}/message/sendText/${instance}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `Evolution API error: status=${response.status} body=${body}`
    );
    throw new Error(`Failed to send WhatsApp message: ${response.status}`);
  }
}
