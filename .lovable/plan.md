

# Ajustes do Sistema — n8n → Zapier + Evolution → Z-API + Mock Data

## 1. Edge Functions

### `_shared/evolution-api.ts` → Rename/rewrite to Z-API
Replace Evolution API integration with Z-API:
- New function `sendWhatsAppMessage(phone, text)` using:
  `POST https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-text`
  Body: `{ "phone": phone, "message": text }`
- Read `ZAPI_INSTANCE_ID` and `ZAPI_TOKEN` from env (secrets to be added)
- Rename file to `z-api.ts` or keep same name, update imports

### `handle-webhook/index.ts`
- Remove `notifyN8n` function (lines 250-276) and both calls to it (confirm/cancel flows)
- Update import from `evolution-api.ts` to new Z-API module
- Confirm flow (reply "1"): just update status to `confirmed` + send WhatsApp
- Cancel flow (reply "2"): just update status to `cancelled` + send WhatsApp with Calendly link
- Keep `TAKEOVER_HOURS` or read from bot_config — either way, remove n8n references

### `handle-webhook/state-machine.ts`
- Replace legacy cases `agendamento_nome`, `agendamento_dia`, `agendamento_hora` with single `agendamento` that redirects to `inicio`

### `_shared/types.ts`
- Update `ConversationState`: replace `agendamento_nome | agendamento_dia | agendamento_hora` with `agendamento`

### `handle-calendly-webhook/index.ts`
- Remove `notifyN8n` function and both calls
- Update import to Z-API module
- Update conversation state search from legacy states to `["agendamento", "menu_profissional"]`
- Remove `temp_data: null` from conversation updates

### `handle-confirmation/index.ts` — DELETE
Redundant function, remove entirely.

## 2. Secrets Required
Two new secrets for Z-API:
- `ZAPI_INSTANCE_ID`
- `ZAPI_TOKEN`

## 3. Frontend

### `Configuracoes.tsx`
- Remove `available_slots` query and "Horários de Atendimento" card
- Add to `messageKeys`: `scheduling_message` ("Mensagem de Agendamento") and `calendly_link` ("Link do Calendly")

### `Pacientes.tsx` + `Conversas.tsx`
- Replace stateLabels: remove `agendamento_dia/hora/nome`, add `agendamento: "Agendamento"`

### Mock Data — All 5 screens
When real data is empty, show mock data with info banner "Dados de exemplo — serão substituídos por dados reais":

- **Dashboard**: 4 mock appointments today (Maria Silva 09:00 confirmed, Joao Santos 10:00 pending, Ana Costa 14:00 cancelled, Pedro Lima 16:00 no_response) + counters + week list
- **Agenda**: Same 4 mocks placed on today's date in the calendar
- **Pacientes**: 4 mock patients with appointment history entries
- **Conversas**: 3 mock conversations in states menu_principal, duvidas, pausado

## Files Changed
- `supabase/functions/_shared/evolution-api.ts` — rewrite to Z-API
- `supabase/functions/_shared/types.ts` — simplify ConversationState
- `supabase/functions/handle-webhook/index.ts` — remove n8n, update import
- `supabase/functions/handle-webhook/state-machine.ts` — simplify states
- `supabase/functions/handle-calendly-webhook/index.ts` — remove n8n, update import
- `supabase/functions/handle-confirmation/index.ts` — delete
- `src/pages/Configuracoes.tsx` — remove available_slots, add calendly fields
- `src/pages/Pacientes.tsx` — stateLabels + mock data
- `src/pages/Conversas.tsx` — stateLabels + mock data
- `src/pages/Dashboard.tsx` — mock data
- `src/pages/Agenda.tsx` — mock data

