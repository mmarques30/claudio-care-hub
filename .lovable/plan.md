

# Correção: Remover Mocks + Realtime + Branding

## Questão importante: Supabase

Este projeto roda no **Lovable Cloud**, que ja fornece um backend integrado (o arquivo `client.ts` e auto-gerado e nao pode ser editado). O URL/chave que voce colou (cjrvjwrhcpsiucchhcry) e de um projeto Supabase externo diferente do que esta conectado aqui (azxbsynrmujmwkeepsih).

**Opcoes:**
- **A)** Trabalhar com o Lovable Cloud atual — as tabelas ja existem aqui (conversations, appointments, bot_config, available_slots, user_roles). Precisa garantir que as colunas extras (patient_email, calendly_event_uri, pending_reason) existam via migration.
- **B)** Se voce precisa apontar para o Supabase externo, isso nao e possivel com Lovable Cloud ativo — o client.ts e gerenciado automaticamente.

**O plano abaixo assume opcao A** (usar o Lovable Cloud atual).

## Colunas faltantes no banco (migration necessaria)

A tabela `appointments` nao tem `patient_email` nem `calendly_event_uri`. A tabela `conversations` nao tem `pending_reason`. Sera necessaria uma migration:

```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendly_event_uri text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pending_reason text;
```

Tambem inserir bot_config keys faltantes:
```sql
INSERT INTO bot_config (key, value) VALUES ('instagram_link', '') ON CONFLICT DO NOTHING;
INSERT INTO bot_config (key, value) VALUES ('clinic_name', 'Cláudio Crot - Fisioterapeuta') ON CONFLICT DO NOTHING;
```

## Alteracoes no Frontend

### 1. Remover TODOS os dados mock de todas as paginas
- **Dashboard.tsx**: Remover `getMockAppointments()`, `isMock`, alert de exemplo. Mostrar zeros/vazio quando nao ha dados.
- **Agenda.tsx**: Remover `getMockAppointments()`, `isMock`, alert. Mostrar calendario vazio.
- **Pacientes.tsx**: Remover `mockPatients`, `getMockHistory`, `mockConversations`, `isMock`, alert.
- **Conversas.tsx**: Remover `mockConversations`, `isMock`, alert.

### 2. Realtime subscriptions
Adicionar `supabase.channel()` para atualizar dados automaticamente:
- **Dashboard**: realtime em `appointments` → invalidar queries
- **Conversas**: realtime em `conversations` → invalidar queries
- **Agenda**: realtime em `appointments` → invalidar queries

### 3. Branding
- **AppSidebar.tsx**: Mudar "Dr. Claudio / Fisioterapia" para "Claudio Crot / Fisioterapeuta"
- **Layout.tsx**: Header "Painel Administrativo" → "Claudio Crot - Fisioterapeuta"
- **Login.tsx**: Atualizar titulo do login

### 4. Conversas — adicionar state `motivo_consulta`
Adicionar ao stateLabels: `motivo_consulta: "Motivo da Consulta"`

### 5. Configuracoes — adicionar campos instagram_link e clinic_name
Adicionar ao array `messageKeys`:
- `{ key: "instagram_link", label: "Link do Instagram" }`
- `{ key: "clinic_name", label: "Nome da Clínica" }`

### 6. Dashboard — contador de conversas ativas
Adicionar query para conversations com `updated_at` nas ultimas 24h.

### 7. Agendamentos — filtros e busca (pagina Agenda)
Adicionar input de busca por nome/telefone e select de filtro por status.

## Arquivos alterados
- `src/pages/Dashboard.tsx` — remover mocks, realtime, conversas ativas
- `src/pages/Agenda.tsx` — remover mocks, realtime, filtros
- `src/pages/Pacientes.tsx` — remover mocks
- `src/pages/Conversas.tsx` — remover mocks, realtime, add motivo_consulta
- `src/pages/Configuracoes.tsx` — add instagram_link, clinic_name
- `src/components/AppSidebar.tsx` — branding
- `src/components/Layout.tsx` — branding
- `src/pages/Login.tsx` — branding
- Migration SQL — colunas + bot_config keys

