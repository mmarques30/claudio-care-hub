

# Ajustes Frontend + Limpeza de Edge Functions

## Estado Atual
A maioria das mudanças solicitadas **ja foi implementada** em iteracoes anteriores:
- Z-API ja esta configurada em `_shared/evolution-api.ts`
- States simplificados em `types.ts` e `state-machine.ts`
- `Configuracoes.tsx` ja tem `scheduling_message` e `calendly_link`, sem available_slots
- `Pacientes.tsx` e `Conversas.tsx` ja tem stateLabels corretos
- Mock data ja existe em todas as 5 telas
- `handle-webhook` ja esta limpo (sem n8n)

## O que falta

### 1. Deletar `handle-calendly-webhook`
Remover `supabase/functions/handle-calendly-webhook/index.ts` — o Zapier cuida disso agora.

### 2. Dashboard — adicionar grafico simples por status
Adicionar um card com grafico de barras simples (CSS puro, sem biblioteca) mostrando a distribuicao de consultas por status: confirmed (verde), pending (amarelo), cancelled (vermelho), no_response (cinza). Funciona com dados reais e mock.

### 3. Limpar tipos legados em `_shared/types.ts`
Remover `EvolutionWebhookPayload` e `CalendlyWebhookPayload` (nao sao mais usados). Manter apenas os tipos usados pelo `handle-webhook`.

## Arquivos alterados
- `supabase/functions/handle-calendly-webhook/index.ts` — deletar
- `supabase/functions/_shared/types.ts` — remover tipos legados
- `src/pages/Dashboard.tsx` — adicionar grafico de barras por status

