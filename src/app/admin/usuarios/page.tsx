import { createClient } from "@/lib/supabase/server";
import { RoleSelect } from "@/features/users/components/role-select";
import { ResetPasswordButton } from "@/features/users/components/reset-password-button";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Usuários</h1>
        <p className="text-sm text-gray-500">Gerencie os papéis de acesso de cada usuário.</p>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Cadastro</th>
              <th className="px-5 py-3 font-medium">Papel</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.full_name}</td>
                <td className="px-5 py-3 text-gray-700">{p.email}</td>
                <td className="px-5 py-3 text-gray-500">{formatDateTime(p.created_at)}</td>
                <td className="px-5 py-3">
                  <RoleSelect profileId={p.id} role={p.role} />
                </td>
                <td className="px-5 py-3 text-right">
                  <ResetPasswordButton email={p.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
