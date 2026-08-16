import { LayoutDashboard, CalendarDays, ClipboardList, Ticket } from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireUser } from "@/lib/auth/session";

const ITEMS: SidebarItem[] = [
  { href: "/minha-conta", label: "Minha conta", icon: LayoutDashboard },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/minhas-inscricoes", label: "Minhas inscrições", icon: ClipboardList },
  { href: "/meus-ingressos", label: "Meus ingressos", icon: Ticket },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <SidebarShell items={ITEMS} title="Área do participante">
      {children}
    </SidebarShell>
  );
}
