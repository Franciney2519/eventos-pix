import { ScanLine, History, Users, Banknote, Receipt, ArrowLeft } from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireRole } from "@/lib/auth/session";

const ICON_SIZE = 18;

const ITEMS: SidebarItem[] = [
  { href: "/checkin", label: "Check-in", icon: <ScanLine size={ICON_SIZE} /> },
  { href: "/checkin/venda-avulsa", label: "Venda avulsa", icon: <Banknote size={ICON_SIZE} /> },
  { href: "/checkin/vendas-avulsas", label: "Histórico de vendas", icon: <Receipt size={ICON_SIZE} /> },
  { href: "/checkin/participantes", label: "Participantes", icon: <Users size={ICON_SIZE} /> },
  { href: "/checkin/historico", label: "Histórico de check-ins", icon: <History size={ICON_SIZE} /> },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { href: "/admin", label: "Voltar ao Admin", icon: <ArrowLeft size={ICON_SIZE} /> },
  ...ITEMS,
];

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("ADMIN", "CHECKIN");
  const items = profile.role === "ADMIN" ? ADMIN_ITEMS : ITEMS;
  return (
    <SidebarShell items={items} title="Check-in">
      {children}
    </SidebarShell>
  );
}
