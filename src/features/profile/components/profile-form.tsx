"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/features/profile/actions";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

export function ProfileForm({ profile }: { profile: Profile }) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar");
        return;
      }
      show("Perfil atualizado!", "success");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">E-mail</label>
        <input className="input bg-gray-50 text-gray-500" value={profile.email} disabled />
      </div>
      <div>
        <label className="label" htmlFor="fullName">
          Nome completo
        </label>
        <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          WhatsApp
        </label>
        <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Salvar alterações
      </button>
    </form>
  );
}
