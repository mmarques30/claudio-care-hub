

# Adicionar tela "Automações" ao menu

## O que será feito

Criar uma nova página **Automações** (`/automacoes`) com campos para configurar as chaves de integração (Z-API, Calendly, etc.), e adicionar o link no sidebar.

## Alterações

### 1. Nova página `src/pages/Automacoes.tsx`
- Cards organizados por integração:
  - **Z-API (WhatsApp)**: campos para `Instance ID` e `Token`, com botão salvar
  - **Calendly**: campo para o link do Calendly (já existe em bot_config, mas fica visível aqui também)
- Os valores serão salvos na tabela `bot_config` com chaves como `zapi_instance_id`, `zapi_token`
- Status visual: indicador verde/vermelho se a chave está preenchida ou não
- Aviso: "Configure as chaves abaixo para ativar as automações do chatbot"

### 2. Sidebar (`AppSidebar.tsx`)
- Adicionar item "Automações" com ícone `Zap` (lucide-react), rota `/automacoes`
- Posicionar entre "Conversas" e "Configurações"

### 3. Router (`App.tsx`)
- Adicionar `<Route path="/automacoes" element={<Automacoes />} />`

## Arquivos alterados
- `src/pages/Automacoes.tsx` — criar
- `src/components/AppSidebar.tsx` — adicionar item no menu
- `src/App.tsx` — adicionar rota

