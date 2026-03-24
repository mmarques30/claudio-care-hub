import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, CheckCircle, Clock, Users, Info } from "lucide-react";
import { format, startOfDay, endOfDay, endOfWeek, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

function getMockAppointments() {
  const today = new Date();
  const base = startOfDay(today);
  return [
    { id: "mock-1", patient_name: "Maria Silva", patient_phone: "5511999990001", reason: "Dor lombar", scheduled_at: new Date(base.getTime() + 9 * 3600000).toISOString(), status: "confirmed", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
    { id: "mock-2", patient_name: "João Santos", patient_phone: "5511999990002", reason: "Reabilitação joelho", scheduled_at: new Date(base.getTime() + 10 * 3600000).toISOString(), status: "pending", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
    { id: "mock-3", patient_name: "Ana Costa", patient_phone: "5511999990003", reason: "Fisioterapia respiratória", scheduled_at: new Date(base.getTime() + 14 * 3600000).toISOString(), status: "cancelled", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
    { id: "mock-4", patient_name: "Pedro Lima", patient_phone: "5511999990004", reason: "Avaliação postural", scheduled_at: new Date(base.getTime() + 16 * 3600000).toISOString(), status: "no_response", reminder_sent: false, calendar_event_id: null, created_at: today.toISOString(), updated_at: today.toISOString() },
  ];
}

export default function Dashboard() {
  const today = new Date();

  const { data: rawTodayAppointments = [] } = useQuery({
    queryKey: ["appointments-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .gte("scheduled_at", startOfDay(today).toISOString())
        .lte("scheduled_at", endOfDay(today).toISOString())
        .order("scheduled_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: rawWeekAppointments = [] } = useQuery({
    queryKey: ["appointments-week"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .gte("scheduled_at", today.toISOString())
        .lte("scheduled_at", endOfWeek(addWeeks(today, 1), { locale: ptBR }).toISOString())
        .order("scheduled_at");
      if (error) throw error;
      return data;
    },
  });

  const isMock = rawTodayAppointments.length === 0 && rawWeekAppointments.length === 0;
  const mockData = getMockAppointments();
  const todayAppointments = isMock ? mockData : rawTodayAppointments;
  const weekAppointments = isMock ? mockData : rawWeekAppointments;

  const confirmed = todayAppointments.filter((a) => a.status === "confirmed").length;
  const pending = todayAppointments.filter((a) => a.status === "pending").length;
  const total = todayAppointments.length;

  const stats = [
    { label: "Consultas Hoje", value: total, icon: Calendar, color: "text-primary" },
    { label: "Confirmadas", value: confirmed, icon: CheckCircle, color: "text-status-confirmed" },
    { label: "Pendentes", value: pending, icon: Clock, color: "text-status-pending" },
    { label: "Esta Semana", value: weekAppointments.length, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {isMock && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Dados de exemplo — serão substituídos por dados reais.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consultas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{a.patient_name || a.patient_phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(a.scheduled_at), "HH:mm")}
                    {a.reason && ` — ${a.reason}`}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weekAppointments.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{a.patient_name || a.patient_phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(a.scheduled_at), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
