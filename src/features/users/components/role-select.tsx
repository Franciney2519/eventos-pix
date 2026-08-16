"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeUserRoleAction } from "@/features/users/actions";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@/types/database";

export function RoleSelect({ profileId, role }: { profileId: string; role: UserRole }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as UserRole;
    startTransition(async () => {
      const result = await changeUserRoleAction(profileId, next);
      if (!result.ok) {
        show(result.error ?? "Não foi possível atualizar", "error");
        return;
      }
      show("Papel atualizado!", "success");
      router.refresh();
    });
  };

  return (
    <select className="input !py-1.5 text-sm" value={role} onChange={onChange} disabled={pending}>
      <option value="CUSTOMER">Participante</option>
      <option value="CHECKIN">Check-in</option>
      <option value="ADMIN">Administrador</option>
    </select>
  );
}
