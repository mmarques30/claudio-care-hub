import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, Phone, Info } from "lucide-react";

const mockPatients = [
  { phone: "5511999990001", name: "Maria Silva" },
  { phone: "5511999990002", name: "João Santos" },
  { phone: "5511999990003", name: "Ana Costa" },
  { phone: "5511999990004", name: "Pedro Lima" },
];

function getMockHistory(phone: string) {
  const today = new Date();
  const base = new Date(today);
  base.setHours(9, 0, 0, 0);
  return [
    { id: `mock-h-${phone}-1`, patient_phone: phone, patient_name: mockPatients.find(p => p.phone === phone)?.name || "", reason: "Dor lombar", scheduled_at: base.toISOString(), status: "confirmed", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
    { id: `mock-h-${phone}-2`, patient_phone: phone, patient_name: mockPatients.find(p => p.phone === phone)?.name || "", reason: "Retorno", scheduled_at: new Date(base.getTime() - 7 * 86400000).toISOString(), status: "confirmed", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
  ];
}

const mockConversations: Record<string, { current_state: string }> = {
  "5511999990001": { current_state: "inicio" },
  "5511999990002": { current_state: "menu_principal" },
  "5511999990003": { current_state: "duvidas" },
  "5511999990004": { current_state: "pausado" },
};

export default function Pacientes() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const { data: rawPatients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("patient_phone, patient_name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map = new Map<string, string | null>();
      data.forEach((d) => {
        if (!map.has(d.patient_phone)) map.set(d.patient_phone, d.patient_name);
      });
      return Array.from(map.entries()).map(([phone, name]) => ({ phone, name }));
    },
  });

  const isMock = rawPatients.length === 0;
  const patients = isMock ? mockPatients : rawPatients;

  const { data: history = [] } = useQuery({
    queryKey: ["patient-history", selectedPhone],
    enabled: !!selectedPhone,
    queryFn: async () => {
      if (isMock) return getMockHistory(selectedPhone!);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_phone", selectedPhone!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: conversation } = useQuery({
    queryKey: ["patient-conversation", selectedPhone],
    enabled: !!selectedPhone,
    queryFn: async () => {
      if (isMock) return mockConversations[selectedPhone!] || null;
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("phone_number", selectedPhone!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const stateLabels: Record<string, string> = {
    inicio: "Início",
    menu_principal: "Menu Principal",
    menu_profissional: "Menu Profissional",
    duvidas: "Dúvidas",
    agendamento: "Agendamento",
    pausado: "Pausado (Cláudio)",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pacientes</h2>

      {isMock && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Dados de exemplo — serão substituídos por dados reais.</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Lista de Pacientes ({patients.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[60vh] overflow-auto">
              {patients.map((p) => (
                <button
                  key={p.phone}
                  onClick={() => setSelectedPhone(p.phone)}
                  className={`w-full text-left p-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                    selectedPhone === p.phone ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{p.name || p.phone}</p>
                      {p.name && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedPhone ? `Histórico — ${selectedPhone}` : "Selecione um paciente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPhone ? (
              <p className="text-sm text-muted-foreground">Clique em um paciente para ver o histórico.</p>
            ) : (
              <div className="space-y-4">
                {conversation && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Estado do Chatbot</p>
                    <p className="text-sm font-medium">
                      {stateLabels[(conversation as { current_state: string }).current_state] || (conversation as { current_state: string }).current_state}
                    </p>
                  </div>
                )}
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {a.reason && <p className="text-xs text-muted-foreground">{a.reason}</p>}
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
