import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const messageKeys = [
  { key: "welcome_message", label: "Mensagem de Boas-vindas" },
  { key: "personal_message", label: "Assunto Pessoal" },
  { key: "professional_menu", label: "Menu Profissional" },
  { key: "services_info", label: "Informações dos Serviços" },
  { key: "scheduling_message", label: "Mensagem de Agendamento" },
  { key: "calendly_link", label: "Link do Calendly" },
  { key: "takeover_duration_minutes", label: "Duração do Takeover (minutos)" },
];

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Record<string, string>>({});

  const { data: botConfig = [] } = useQuery({
    queryKey: ["bot-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bot_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    botConfig.forEach((c) => (map[c.key] = c.value));
    setMessages(map);
  }, [botConfig]);

  const saveMessage = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("bot_config")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-config"] });
      toast.success("Configuração salva!");
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configurações</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mensagens do Bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messageKeys.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              {key === "takeover_duration_minutes" ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={messages[key] || ""}
                    onChange={(e) => setMessages({ ...messages, [key]: e.target.value })}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveMessage.mutate({ key, value: messages[key] || "" })}
                    disabled={saveMessage.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              ) : key === "calendly_link" ? (
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={messages[key] || ""}
                    onChange={(e) => setMessages({ ...messages, [key]: e.target.value })}
                    placeholder="https://calendly.com/..."
                  />
                  <Button
                    size="sm"
                    onClick={() => saveMessage.mutate({ key, value: messages[key] || "" })}
                    disabled={saveMessage.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    value={messages[key] || ""}
                    onChange={(e) => setMessages({ ...messages, [key]: e.target.value })}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveMessage.mutate({ key, value: messages[key] || "" })}
                    disabled={saveMessage.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
