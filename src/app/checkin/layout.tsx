import { ScanLine, History, Users } from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireRole } from "@/lib/auth/session";

const ICON_SIZE = 18;

const ITEMS: SidebarItem[] = [
  { href: "/checkin", label: "Check-in", icon: <ScanLine size={ICON_SIZE} /> },
  { href: "/checkin/participantes", label: "Participantes", icon: <Users size={ICON_SIZE} /> },
  { href: "/checkin/historico", label: "Histórico", icon: <History size={ICON_SIZE} /> },
];

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN", "CHECKIN");
  return (
    <SidebarShell items={ITEMS} title="Check-in">
      {children}
    </SidebarShell>
  );
}
