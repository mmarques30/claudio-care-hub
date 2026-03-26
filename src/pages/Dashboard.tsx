import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, CheckCircle, Clock, Users, MessageSquare } from "lucide-react";
import { format, startOfDay, endOfDay, endOfWeek, addWeeks, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = new Date();

  const { data: todayAppointments = [] } = useQuery({
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

  const { data: weekAppointments = [] } = useQuery({
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

  const { data: activeConversations = 0 } = useQuery({
    queryKey: ["active-conversations"],
    queryFn: async () => {
      const since = subHours(new Date(), 24).toISOString();
      const { count, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", since);
      if (error) throw error;
      return count || 0;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["appointments-today"] });
        queryClient.invalidateQueries({ queryKey: ["appointments-week"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["active-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const confirmed = todayAppointments.filter((a) => a.status === "confirmed").length;
  const pending = todayAppointments.filter((a) => a.status === "pending").length;
  const total = todayAppointments.length;

  const stats = [
    { label: "Consultas Hoje", value: total, icon: Calendar, color: "text-primary" },
    { label: "Confirmadas", value: confirmed, icon: CheckCircle, color: "text-status-confirmed" },
    { label: "Pendentes", value: pending, icon: Clock, color: "text-status-pending" },
    { label: "Conversas Ativas", value: activeConversations, icon: MessageSquare, color: "text-primary" },
  ];

  const statusCounts = [
    { label: "Confirmadas", count: todayAppointments.filter(a => a.status === "confirmed").length, color: "bg-status-confirmed" },
    { label: "Pendentes", count: todayAppointments.filter(a => a.status === "pending").length, color: "bg-status-pending" },
    { label: "Canceladas", count: todayAppointments.filter(a => a.status === "cancelled").length, color: "bg-status-cancelled" },
    { label: "Sem Resposta", count: todayAppointments.filter(a => a.status === "no_response").length, color: "bg-status-no-response" },
  ];
  const max = Math.max(...statusCounts.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

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
          <CardTitle className="text-lg">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusCounts.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28 shrink-0">{s.label}</span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div className={`${s.color} h-full rounded-full transition-all`} style={{ width: `${(s.count / max) * 100}%`, minWidth: s.count > 0 ? '1.5rem' : 0 }} />
                </div>
                <span className="text-sm font-medium w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consultas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {weekAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para os próximos dias.</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
