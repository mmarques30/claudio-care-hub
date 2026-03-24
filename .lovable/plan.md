

# Ajustes do Sistema — Migração n8n → Zapier + Mock Data

## 1. Database Migration
Add missing columns to `appointments`:
```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendly_event_uri text;
```

## 2. Insert missing bot_config keys
Insert `scheduling_message` and `calendly_link` via insert tool.

## 3. Edge Functions

### handle-webhook/index.ts
- Remove `notifyN8n` function and all calls to it
- On reply "1" (confirm): just update status to `confirmed` + send WhatsApp
- On reply "2" (reschedule): just update status to `cancelled` + send WhatsApp with Calendly link
- Remove `TAKEOVER_HOURS` constant, read `takeover_duration_minutes` from bot_config instead

### handle-webhook/state-machine.ts
- Remove legacy states `agendamento_nome`, `agendamento_dia`, `agendamento_hora` from switch
- Add `agendamento` case (just redirects to `inicio`)
- Update `ConversationState` type in `_shared/types.ts`

### handle-calendly-webhook/index.ts
- Remove `notifyN8n` function and all calls to it
- On `invitee.created`: insert appointment (now with `patient_email` and `calendly_event_uri`) + send WhatsApp
- On `invitee.canceled`: update status + send WhatsApp
- Remove legacy state references in conversation search (`agendamento_hora`, etc.)

### Delete handle-confirmation/index.ts
Remove the entire function — redundant with handle-webhook.

### Update _shared/types.ts
Simplify `ConversationState`: replace `agendamento_nome|dia|hora` with single `agendamento`.

## 4. Frontend — Configuracoes.tsx
- Remove entire "Horários de Atendimento" section (available_slots queries and UI)
- Add `scheduling_message` and `calendly_link` to `messageKeys` array
- Keep all other existing message fields

## 5. Frontend — Update stateLabels
In both `Pacientes.tsx` and `Conversas.tsx`:
- Remove `agendamento_dia`, `agendamento_hora`, `agendamento_nome`
- Add `agendamento: "Agendamento"`

## 6. Frontend — Mock Data (all 5 screens)
When real data is empty, show mock data with a banner "Dados de exemplo — serão substituídos por dados reais":

**Dashboard**: 4 mock appointments today (Maria Silva 09:00 confirmed, João Santos 10:00 pending, Ana Costa 14:00 cancelled, Pedro Lima 16:00 no_response) + week view

**Agenda**: Same 4 mock appointments rendered on today's calendar date

**Pacientes**: 4 mock patients with history entries

**Conversas**: 3 mock conversations in states menu_principal, duvidas, pausado

Each page: check if real data array is empty → use mock array instead, show info banner.

## Files Changed
- 1 migration (alter appointments)
- 1 insert (bot_config keys)
- `supabase/functions/handle-webhook/index.ts` — remove n8n
- `supabase/functions/handle-webhook/state-machine.ts` — simplify states
- `supabase/functions/handle-calendly-webhook/index.ts` — remove n8n
- `supabase/functions/handle-confirmation/index.ts` — delete
- `supabase/functions/_shared/types.ts` — update ConversationState
- `src/pages/Dashboard.tsx` — mock data
- `src/pages/Agenda.tsx` — mock data
- `src/pages/Pacientes.tsx` — mock data + stateLabels
- `src/pages/Conversas.tsx` — mock data + stateLabels
- `src/pages/Configuracoes.tsx` — remove available_slots, add calendly fields

