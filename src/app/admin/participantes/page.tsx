import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listParticipants } from "@/features/participants/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const supabase = await createClient();
  const participants = await listParticipants(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Participantes</h1>
        <p className="text-sm text-gray-500">Todos os usuários cadastrados como participantes.</p>
      </div>

      {participants.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum participante cadastrado ainda" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">WhatsApp</th>
                <th className="px-5 py-3 font-medium">Ingressos</th>
                <th className="px-5 py-3 font-medium">Check-ins</th>
                <th className="px-5 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.full_name}</td>
                  <td className="px-5 py-3 text-gray-700">{p.email}</td>
                  <td className="px-5 py-3 text-gray-700">{p.phone}</td>
                  <td className="px-5 py-3 text-gray-700">{p.ticketsTotal}</td>
                  <td className="px-5 py-3 text-gray-700">{p.ticketsUsed}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
