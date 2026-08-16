import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getTicketsForBadges } from "@/features/tickets/repository";
import { BadgeSheet } from "@/features/tickets/components/badge-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { IdCard } from "lucide-react";

export const dynamic = "force-dynamic";

// Deliberately outside /admin's layout (no sidebar/nav chrome) — this page
// is meant to be printed directly, and its own auth check replaces the one
// the admin layout would otherwise provide.
export default async function BadgesPrintPage({ searchParams }: { searchParams: { ids?: string } }) {
  await requireRole("ADMIN");

  const ticketIds = (searchParams.ids ?? "").split(",").filter(Boolean);
  const supabase = await createClient();
  const tickets = await getTicketsForBadges(supabase, ticketIds);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (tickets.length === 0) {
    return (
      <div className="p-8">
        <EmptyState icon={IdCard} title="Nenhum ingresso selecionado" description="Volte para /admin/ingressos e selecione ao menos um." />
      </div>
    );
  }

  return <BadgeSheet tickets={tickets} appUrl={appUrl} />;
}
