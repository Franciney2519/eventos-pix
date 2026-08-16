import Link from "next/link";
import { CalendarDays, ClipboardList, Ticket } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listOrdersForUser } from "@/features/orders/repository";
import { listTicketsForUser } from "@/features/tickets/repository";
import { listPublicEvents } from "@/features/events/repository";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [orders, tickets, events] = await Promise.all([
    listOrdersForUser(supabase, user.id),
    listTicketsForUser(supabase, user.id),
    listPublicEvents(supabase),
  ]);

  const pendingOrders = orders.filter((o) => o.payment_status === "PENDING");
  const availableTickets = tickets.filter((t) => t.status === "AVAILABLE");
  const upcomingEvents = events.filter((e) => e.status === "OPEN").slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Olá, {user.profile.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">Acompanhe seus eventos, inscrições e ingressos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="Próximos eventos" value={upcomingEvents.length} href="/eventos" />
        <StatCard icon={ClipboardList} label="Inscrições pendentes" value={pendingOrders.length} href="/minhas-inscricoes" />
        <StatCard icon={Ticket} label="Ingressos disponíveis" value={availableTickets.length} href="/meus-ingressos" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Próximos eventos</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum evento com inscrições abertas no momento.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/eventos/${e.slug}`} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.name}</p>
                      <p className="text-xs text-gray-500">{formatEventDate(e.event_date)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Inscrições recentes</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">Você ainda não fez nenhuma inscrição.</p>
          ) : (
            <ul className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/minhas-inscricoes/${o.id}`} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{o.events?.name}</p>
                      <p className="text-xs text-gray-500">#{o.order_number}</p>
                    </div>
                    <OrderStatusBadge status={o.order_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card max-w-lg">
        <h2 className="mb-4 font-semibold text-gray-900">Meu perfil</h2>
        <ProfileForm profile={user.profile} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="card flex items-center gap-4 hover:border-brand-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Link>
  );
}
