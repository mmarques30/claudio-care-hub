# Deploy Evolution API no Railway

## 1. Pré-requisitos

- Conta no [Railway](https://railway.app)
- Projeto Railway já criado com PostgreSQL (banco de dados)

## 2. Criar serviço da Evolution API

### Opção A: Via Docker Image (mais simples)
1. No projeto Railway, clique **"+ New"** → **"Docker Image"**
2. Digite: `atendai/evolution-api:v2.2.3`
3. Clique em **"Deploy"**

### Opção B: Via este repositório
1. No projeto Railway, clique **"+ New"** → **"GitHub Repo"**
2. Selecione este repositório
3. Em **Settings** → **Root Directory**, coloque: `evolution-api`
4. Railway vai detectar o Dockerfile e fazer o build

## 3. Variáveis de Ambiente

Clique no serviço da Evolution API → aba **Variables** → adicione:

```
AUTHENTICATION_API_KEY=sua-chave-secreta-aqui
SERVER_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
SERVER_PORT=8080
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
```

> **IMPORTANTE:** Gere uma chave segura para `AUTHENTICATION_API_KEY`:
> ```bash
> openssl rand -hex 32
> ```

## 4. Expor porta pública

1. Clique no serviço → **Settings** → **Networking**
2. Em **Public Networking**, clique **"Generate Domain"**
3. Railway vai gerar um domínio tipo: `evolution-api-xxx.up.railway.app`

## 5. Verificar que está rodando

Acesse no navegador:
```
https://SEU-DOMINIO.up.railway.app/
```

Deve retornar algo como:
```json
{
  "status": 200,
  "message": "Welcome to the Evolution API"
}
```

Teste a autenticação:
```bash
curl -X GET https://SEU-DOMINIO.up.railway.app/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

## 6. Criar instância "claudio-fisio"

```bash
export EVOLUTION_URL=https://SEU-DOMINIO.up.railway.app
export API_KEY=sua-chave-secreta-aqui

curl -X POST "${EVOLUTION_URL}/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: ${API_KEY}" \
  -d '{
    "instanceName": "claudio-fisio",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "rejectCall": true,
    "msgCall": "Não posso atender agora. Envie uma mensagem de texto.",
    "groupsIgnore": true,
    "alwaysOnline": true,
    "readMessages": true,
    "readStatus": false
  }'
```

A resposta vai conter um **QR Code**. Escaneie com o WhatsApp do Cláudio para conectar.

### Verificar conexão
```bash
curl -X GET "${EVOLUTION_URL}/instance/connectionState/claudio-fisio" \
  -H "apikey: ${API_KEY}"
```

Deve retornar `"state": "open"` quando conectado.

## 7. Configurar Webhook para Supabase

O webhook envia as mensagens recebidas para a Edge Function `handle-webhook`.

```bash
export SUPABASE_REF=seu-project-ref-aqui

curl -X POST "${EVOLUTION_URL}/webhook/set/claudio-fisio" \
  -H "Content-Type: application/json" \
  -H "apikey: ${API_KEY}" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://'"${SUPABASE_REF}"'.supabase.co/functions/v1/handle-webhook",
      "webhookByEvents": false,
      "webhookBase64": false,
      "events": [
        "MESSAGES_UPSERT"
      ]
    }
  }'
```

### Verificar webhook configurado
```bash
curl -X GET "${EVOLUTION_URL}/webhook/find/claudio-fisio" \
  -H "apikey: ${API_KEY}"
```

## 8. Teste end-to-end

1. Envie uma mensagem de WhatsApp para o número conectado
2. Verifique nos logs do Supabase se a Edge Function `handle-webhook` recebeu o evento
3. O chatbot deve responder automaticamente

## Variáveis necessárias no Supabase

Certifique-se de que a Edge Function `handle-webhook` tem:
- `EVOLUTION_API_URL` = URL da Evolution API no Railway
- `EVOLUTION_API_KEY` = mesma chave do `AUTHENTICATION_API_KEY`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Verifique se a instância foi criada e o domínio está público |
| Webhook não chega | Verifique a URL do webhook e se a Edge Function está deployed |
| "Unauthorized" | Confira se a `apikey` header bate com `AUTHENTICATION_API_KEY` |
| Desconecta do WhatsApp | Normal no plano free do Railway (sleep). Upgrade para plano pago |
