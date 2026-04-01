import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";

export default function Conversas() {
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["bot-config-takeover"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_config")
        .select("value")
        .eq("key", "takeover_duration_minutes")
        .single();
      if (error) throw error;
      return parseInt(data.value);
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("conversas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const toggleTakeover = useMutation({
    mutationFn: async ({ id, pause }: { id: string; pause: boolean }) => {
      const takeoverUntil = pause ? addMinutes(new Date(), config || 120).toISOString() : null;
      const { error } = await supabase
        .from("conversations")
        .update({ takeover_until: takeoverUntil })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Status atualizado!");
    },
  });

  const stateLabels: Record<string, string> = {
    inicio: "Início",
    menu_principal: "Menu Principal",
    menu_profissional: "Menu Profissional",
    duvidas: "Dúvidas",
    agendamento: "Agendamento",
    motivo_consulta: "Motivo da Consulta",
    pausado: "Pausado",
  };

  const isPaused = (conv: typeof conversations[0]) =>
    conv.takeover_until && new Date(conv.takeover_until) > new Date();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Conversas</h2>

      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const paused = isPaused(conv);
            return (
              <Card key={conv.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conv.phone_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Estado: {stateLabels[conv.current_state] || conv.current_state}
                    </p>
                    {paused && (
                      <p className="text-xs text-status-pending font-medium">
                        Bot pausado até {format(new Date(conv.takeover_until!), "HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {format(new Date(conv.updated_at), "dd/MM HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant={paused ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTakeover.mutate({ id: conv.id, pause: !paused })}
                    disabled={toggleTakeover.isPending}
                  >
                    {paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                    {paused ? "Retomar Bot" : "Pausar Bot"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
