#!/bin/bash
# Setup script for Evolution API instance + webhook
# Usage: ./setup-instance.sh

set -e

# Check required env vars
if [ -z "$EVOLUTION_URL" ]; then
  echo "Error: EVOLUTION_URL not set"
  echo "  export EVOLUTION_URL=https://your-domain.up.railway.app"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "Error: API_KEY not set"
  echo "  export API_KEY=your-authentication-api-key"
  exit 1
fi

if [ -z "$SUPABASE_REF" ]; then
  echo "Error: SUPABASE_REF not set"
  echo "  export SUPABASE_REF=your-supabase-project-ref"
  exit 1
fi

INSTANCE_NAME="claudio-fisio"
WEBHOOK_URL="https://${SUPABASE_REF}.supabase.co/functions/v1/handle-webhook"

echo "=== Evolution API Setup ==="
echo "URL: $EVOLUTION_URL"
echo "Instance: $INSTANCE_NAME"
echo "Webhook: $WEBHOOK_URL"
echo ""

# Step 1: Check API is running
echo "1. Checking Evolution API..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$EVOLUTION_URL/")
if [ "$HEALTH" != "200" ]; then
  echo "   Error: API not reachable (HTTP $HEALTH)"
  exit 1
fi
echo "   OK"

# Step 2: Create instance
echo "2. Creating instance '$INSTANCE_NAME'..."
CREATE_RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -d '{
    "instanceName": "'"$INSTANCE_NAME"'",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "rejectCall": true,
    "msgCall": "Não posso atender agora. Envie uma mensagem de texto.",
    "groupsIgnore": true,
    "alwaysOnline": true,
    "readMessages": true,
    "readStatus": false
  }')

echo "   Response: $CREATE_RESPONSE"
echo ""

# Step 3: Set webhook
echo "3. Configuring webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/webhook/set/$INSTANCE_NAME" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "'"$WEBHOOK_URL"'",
      "webhookByEvents": false,
      "webhookBase64": false,
      "events": ["MESSAGES_UPSERT"]
    }
  }')

echo "   Response: $WEBHOOK_RESPONSE"
echo ""

# Step 4: Get QR Code
echo "4. Fetching QR Code..."
echo "   Open this URL in a browser to scan the QR Code:"
echo "   $EVOLUTION_URL/instance/connect/$INSTANCE_NAME"
echo ""

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Scan the QR Code with WhatsApp"
echo "  2. Check connection: curl -H 'apikey: $API_KEY' $EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME"
echo "  3. Send a test message to the connected WhatsApp number"
