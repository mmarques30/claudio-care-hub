

# Ajustes Frontend — Recuperação de Senha

## Estado Atual (ja correto)
- **Conversas**: stateLabels ja tem `agendamento: "Agendamento"`, sem estados legados
- **Automacoes**: ja tem apenas Calendly, sem Z-API credentials
- **Configuracoes**: ja tem `scheduling_message` e `calendly_link`, sem available_slots
- **types.ts**: auto-gerado — sera atualizado automaticamente quando o banco sincronizar (as colunas `patient_email` e `calendly_event_uri` ja existem no banco)

## O que falta

### 1. Link "Esqueci minha senha" no Login
Adicionar link abaixo do botao de login que abre um modal/formulario para digitar o email e chamar `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`.

### 2. Pagina `/reset-password`
- Verificar `type=recovery` no URL hash via `onAuthStateChange`
- Formulario para nova senha + confirmacao
- Chamar `supabase.auth.updateUser({ password })` ao submeter
- Rota publica no App.tsx (fora do ProtectedRoute)

## Arquivos alterados
- `src/pages/Login.tsx` — adicionar link "Esqueci minha senha" + logica de reset email
- `src/pages/ResetPassword.tsx` — criar pagina de nova senha
- `src/App.tsx` — adicionar rota publica `/reset-password`

