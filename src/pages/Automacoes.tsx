import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

export default function Automacoes() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

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
    setValues(map);
  }, [botConfig]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from("bot_config")
        .update({ value })
        .eq("key", key)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from("bot_config")
          .insert({ key, value });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-config"] });
      toast.success("Configuração salva!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const isFilled = (key: string) => !!(values[key] && values[key].trim());

  const StatusDot = ({ filled }: { filled: boolean }) => (
    filled
      ? <CheckCircle className="h-4 w-4 text-primary" />
      : <XCircle className="h-4 w-4 text-destructive" />
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Automações</h2>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Configure as integrações abaixo para ativar as automações do chatbot WhatsApp.
          As credenciais da Z-API são gerenciadas nos secrets do backend.
        </p>
      </div>

      {/* Calendly */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Calendly</CardTitle>
              <CardDescription>Link de agendamento enviado aos pacientes pelo bot</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <StatusDot filled={isFilled("calendly_link")} />
              <span className="text-xs text-muted-foreground">
                {isFilled("calendly_link") ? "Configurado" : "Pendente"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Link do Calendly</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={values["calendly_link"] || ""}
              onChange={(e) => setValues({ ...values, calendly_link: e.target.value })}
              placeholder="https://calendly.com/..."
            />
            <Button
              size="sm"
              onClick={() => saveMutation.mutate({ key: "calendly_link", value: values["calendly_link"] || "" })}
              disabled={saveMutation.isPending}
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
