"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, MessageCircle, X } from "lucide-react";
import { getAdminContactsAction, type AdminContact } from "@/features/support/actions";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const DEFAULT_MESSAGE = "Olá! Estou com uma dúvida sobre o evento.";

export function HelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<AdminContact[] | null>(null);

  useEffect(() => {
    if (!open || contacts !== null) return;
    setLoading(true);
    getAdminContactsAction()
      .then(setContacts)
      .finally(() => setLoading(false));
  }, [open, contacts]);

  // Staff already know how to reach each other — this widget is for
  // participants browsing the public/customer side of the app.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkin")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center border-2 border-brand-700 bg-brand-600 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="Dúvidas"
      >
        <CircleHelp size={26} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Precisa de ajuda?</h2>
                <p className="text-sm text-gray-500">Escolha quem você quer chamar no WhatsApp.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {loading && <p className="text-sm text-gray-400">Carregando...</p>}

            {!loading && contacts !== null && contacts.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum administrador com WhatsApp cadastrado no momento.</p>
            )}

            {!loading && contacts !== null && contacts.length > 0 && (
              <ul className="space-y-2">
                {contacts.map((c) => {
                  const link = buildWhatsAppLink(c.phone, DEFAULT_MESSAGE);
                  if (!link) return null;
                  return (
                    <li key={c.id}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 border-2 border-gray-200 p-3 text-sm font-medium text-gray-900 hover:border-success-500 hover:bg-success-50"
                      >
                        <MessageCircle size={18} className="shrink-0 text-success-600" />
                        {c.fullName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
