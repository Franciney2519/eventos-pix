import { requireRole } from "@/lib/auth/session";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ChangePasswordButton } from "@/features/profile/components/change-password-button";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const user = await requireRole("ADMIN");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Meu perfil</h1>
        <p className="text-sm text-gray-500">Dados da sua conta de administrador.</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-gray-900">Dados pessoais</h2>
        <ProfileForm profile={user.profile} />
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Segurança</h2>
        <div>
          <p className="label mb-1">Papel de acesso</p>
          <span className="badge-success">Administrador</span>
        </div>
        <ChangePasswordButton email={user.profile.email} />
      </div>
    </div>
  );
}
