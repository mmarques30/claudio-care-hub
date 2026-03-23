

# Painel Administrativo — Dr. Cláudio Fisioterapia

## Backend (Supabase / Lovable Cloud)

### Banco de Dados
Criar 4 tabelas conforme especificado:
- **conversations** — estado do chatbot por paciente
- **appointments** — agendamentos com status colorido
- **bot_config** — mensagens e configs do bot (com dados iniciais)
- **available_slots** — horários disponíveis seg-sex (com dados iniciais)

RLS habilitado em todas as tabelas com policies para service_role.

## Frontend — 5 Telas

### 1. Dashboard
- Cards coloridos com consultas de hoje (verde=confirmada, amarelo=pendente, cinza=sem resposta, vermelho=cancelada)
- Contadores: total, confirmadas, pendentes
- Lista das próximas consultas da semana

### 2. Agenda
- Calendário visual mensal/semanal
- Blocos coloridos por status dos appointments
- Modal de detalhes ao clicar (nome, telefone, motivo, status)

### 3. Configurações
- Formulário para editar mensagens do bot (bot_config)
- Configuração de horários: checkbox por dia, início/fim, duração e intervalo

### 4. Pacientes
- Lista de pacientes por telefone único
- Histórico de agendamentos por paciente
- Estado atual da conversa no chatbot

### 5. Conversas
- Lista de conversas ativas com estado atual
- Botão "Pausar Bot" (seta takeover_until)

## Design
- Tema claro profissional, tons de azul e branco
- Mobile-first / responsivo
- Sidebar com navegação (colapsável no mobile)
- Logo "Dr. Cláudio - Fisioterapia"

