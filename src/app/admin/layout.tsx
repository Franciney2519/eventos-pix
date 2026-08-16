import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Ticket,
  Users,
  ScanLine,
  BarChart3,
  UserCog,
} from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireRole } from "@/lib/auth/session";

const ITEMS: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: ClipboardList },
  { href: "/admin/ingressos", label: "Ingressos", icon: Ticket },
  { href: "/admin/participantes", label: "Participantes", icon: Users },
  { href: "/admin/checkins", label: "Check-ins", icon: ScanLine },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <SidebarShell items={ITEMS} title="Administração">
      {children}
    </SidebarShell>
  );
}
