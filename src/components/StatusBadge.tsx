import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "bg-status-confirmed text-white" },
  pending: { label: "Pendente", className: "bg-status-pending text-white" },
  cancelled: { label: "Cancelada", className: "bg-status-cancelled text-white" },
  no_response: { label: "Sem Resposta", className: "bg-status-no-response text-white" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
