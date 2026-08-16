import { ScanLine, History } from "lucide-react";
import { SidebarShell, type SidebarItem } from "@/components/layout/sidebar-shell";
import { requireRole } from "@/lib/auth/session";

const ITEMS: SidebarItem[] = [
  { href: "/checkin", label: "Check-in", icon: ScanLine },
  { href: "/checkin/historico", label: "Histórico", icon: History },
];

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN", "CHECKIN");
  return (
    <SidebarShell items={ITEMS} title="Check-in">
      {children}
    </SidebarShell>
  );
}
