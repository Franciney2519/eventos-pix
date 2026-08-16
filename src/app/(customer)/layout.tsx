import { LayoutDashboard, CalendarDays, ClipboardList, Ticket } from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireUser } from "@/lib/auth/session";

const ICON_SIZE = 18;

const ITEMS: SidebarItem[] = [
  { href: "/minha-conta", label: "Minha conta", icon: <LayoutDashboard size={ICON_SIZE} /> },
  { href: "/eventos", label: "Eventos", icon: <CalendarDays size={ICON_SIZE} /> },
  { href: "/minhas-inscricoes", label: "Minhas inscrições", icon: <ClipboardList size={ICON_SIZE} /> },
  { href: "/meus-ingressos", label: "Meus ingressos", icon: <Ticket size={ICON_SIZE} /> },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <SidebarShell items={ITEMS} title="Área do participante">
      {children}
    </SidebarShell>
  );
}
