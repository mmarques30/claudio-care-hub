import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const messageKeys = [
  { key: "welcome_message", label: "Mensagem de Boas-vindas" },
  { key: "personal_message", label: "Assunto Pessoal" },
  { key: "professional_menu", label: "Menu Profissional" },
  { key: "services_info", label: "Informações dos Serviços" },
  { key: "takeover_duration_minutes", label: "Duração do Takeover (minutos)" },
];

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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

  const { data: slots = [] } = useQuery({
    queryKey: ["available-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("available_slots")
        .select("*")
        .order("day_of_week");
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
      toast.success("Mensagem salva!");
    },
  });

  const updateSlot = useMutation({
    mutationFn: async (slot: {
      id: string;
      is_active?: boolean;
      start_time?: string;
      end_time?: string;
      slot_duration_minutes?: number;
      slot_gap_minutes?: number;
    }) => {
      const { id, ...updates } = slot;
      const { error } = await supabase
        .from("available_slots")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      toast.success("Horário atualizado!");
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horários de Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
              const slot = slots.find((s) => s.day_of_week === dow);
              return (
                <div key={dow} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Checkbox
                      checked={slot?.is_active ?? false}
                      onCheckedChange={(checked) => {
                        if (slot) {
                          updateSlot.mutate({ id: slot.id, is_active: !!checked });
                        }
                      }}
                      disabled={!slot}
                    />
                    <span className="text-sm font-medium">{dayNames[dow]}</span>
                  </div>
                  {slot ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Input
                        type="time"
                        className="w-28 h-8"
                        defaultValue={slot.start_time}
                        onBlur={(e) => updateSlot.mutate({ id: slot.id, start_time: e.target.value })}
                      />
                      <span>até</span>
                      <Input
                        type="time"
                        className="w-28 h-8"
                        defaultValue={slot.end_time}
                        onBlur={(e) => updateSlot.mutate({ id: slot.id, end_time: e.target.value })}
                      />
                      <span className="text-muted-foreground">|</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-16 h-8"
                          defaultValue={slot.slot_duration_minutes}
                          onBlur={(e) =>
                            updateSlot.mutate({ id: slot.id, slot_duration_minutes: parseInt(e.target.value) })
                          }
                        />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-16 h-8"
                          defaultValue={slot.slot_gap_minutes}
                          onBlur={(e) =>
                            updateSlot.mutate({ id: slot.id, slot_gap_minutes: parseInt(e.target.value) })
                          }
                        />
                        <span className="text-xs text-muted-foreground">intervalo</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem horário cadastrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
