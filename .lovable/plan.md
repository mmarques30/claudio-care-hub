

# Autenticação + Limpeza Final do Frontend

## O que já está pronto
- Configurações: já tem `scheduling_message`, `calendly_link`, sem `available_slots`
- Pacientes/Conversas: stateLabels já corretos (com `agendamento`, sem estados legados)
- Dashboard: já tem gráfico de barras por status + mock data
- Edge Functions legadas já deletadas (só resta `handle-webhook`)
- Mock data em todas as telas

## O que falta implementar

### 1. Autenticação com Supabase Auth
- **`src/pages/Login.tsx`**: Tela de login com email/senha, logo "Consultório Dr. Cláudio", design limpo profissional. Usa `supabase.auth.signInWithPassword()`. Link opcional para registro.
- **`src/pages/Register.tsx`**: Tela de registro com email/senha, `supabase.auth.signUp()`.
- **`src/components/ProtectedRoute.tsx`**: Wrapper que verifica sessão via `onAuthStateChange` + `getSession`. Se não autenticado, redireciona para `/login`.
- **`src/App.tsx`**: Envolver rotas existentes com `ProtectedRoute`. Adicionar rotas públicas `/login` e `/register`.
- **Logout**: Adicionar botão de logout no header (`Layout.tsx`) que chama `supabase.auth.signOut()`.

### 2. Automações — Remover Z-API credentials
- **`src/pages/Automacoes.tsx`**: Remover campos de `zapi_instance_id` e `zapi_token` (gerenciados via Secrets do backend). Manter apenas o card do Calendly.

### 3. types.ts — NÃO EDITAR
O arquivo `types.ts` é auto-gerado. Os campos `patient_email` e `calendly_event_uri` precisam ser adicionados via migration no banco (a tabela já deveria tê-los). O types.ts será atualizado automaticamente.

## Arquivos alterados
- `src/pages/Login.tsx` — criar
- `src/pages/Register.tsx` — criar
- `src/components/ProtectedRoute.tsx` — criar
- `src/App.tsx` — adicionar rotas de auth + proteção
- `src/components/Layout.tsx` — botão logout no header
- `src/pages/Automacoes.tsx` — remover campos Z-API

