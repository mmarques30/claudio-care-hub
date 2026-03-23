import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function Agenda() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<Tables<"appointments"> | null>(null);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-month", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at");
      if (error) throw error;
      return data;
    },
  });

  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start); // 0=Sun

  const statusColor: Record<string, string> = {
    confirmed: "bg-status-confirmed",
    pending: "bg-status-pending",
    cancelled: "bg-status-cancelled",
    no_response: "bg-status-no-response",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agenda</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="grid grid-cols-7 gap-px">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dayAppts = appointments.filter((a) => isSameDay(new Date(a.scheduled_at), day));
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[60px] md:min-h-[80px] border rounded-md p-1 text-xs"
                >
                  <div className="font-medium text-muted-foreground mb-1">{format(day, "d")}</div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className={`w-full text-left truncate text-[10px] md:text-xs px-1 py-0.5 rounded text-white ${statusColor[a.status] || statusColor.pending}`}
                      >
                        {format(new Date(a.scheduled_at), "HH:mm")} {a.patient_name || ""}
                      </button>
                    ))}
                    {dayAppts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{dayAppts.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{selected.patient_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{selected.patient_phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">
                  {format(new Date(selected.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="font-medium">{selected.reason || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
