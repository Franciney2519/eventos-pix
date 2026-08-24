import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Ticket,
  Users,
  ScanLine,
  BarChart3,
  UserCog,
  Mail,
  UserCircle,
  Banknote,
  Receipt,
} from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireRole } from "@/lib/auth/session";

const ICON_SIZE = 18;

const ITEMS: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={ICON_SIZE} /> },
  { href: "/admin/eventos", label: "Eventos", icon: <CalendarDays size={ICON_SIZE} /> },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: <ClipboardList size={ICON_SIZE} /> },
  { href: "/admin/ingressos", label: "Ingressos", icon: <Ticket size={ICON_SIZE} /> },
  { href: "/checkin/venda-avulsa", label: "Venda avulsa", icon: <Banknote size={ICON_SIZE} /> },
  { href: "/checkin/vendas-avulsas", label: "Histórico de vendas avulsas", icon: <Receipt size={ICON_SIZE} /> },
  { href: "/admin/participantes", label: "Participantes", icon: <Users size={ICON_SIZE} /> },
  { href: "/admin/checkins", label: "Check-ins", icon: <ScanLine size={ICON_SIZE} /> },
  { href: "/admin/relatorios", label: "Relatórios", icon: <BarChart3 size={ICON_SIZE} /> },
  { href: "/admin/email-logs", label: "E-mails", icon: <Mail size={ICON_SIZE} /> },
  { href: "/admin/usuarios", label: "Usuários", icon: <UserCog size={ICON_SIZE} /> },
  { href: "/admin/perfil", label: "Meu perfil", icon: <UserCircle size={ICON_SIZE} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <SidebarShell items={ITEMS} title="Administração">
      {children}
    </SidebarShell>
  );
}
