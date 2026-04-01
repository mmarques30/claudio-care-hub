export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<void> {
  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");

  if (!instanceId || !token) {
    throw new Error("Missing ZAPI_INSTANCE_ID or ZAPI_TOKEN");
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: phone,
      message: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Z-API error: status=${response.status} body=${body}`);
    throw new Error(`Failed to send WhatsApp message: ${response.status}`);
  }
}
