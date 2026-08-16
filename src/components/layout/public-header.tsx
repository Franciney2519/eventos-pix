import Link from "next/link";
import { Ticket } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/features/auth/actions";

export async function PublicHeader() {
  const user = await getSessionUser();
  const isStaff = user?.profile.role === "ADMIN" || user?.profile.role === "CHECKIN";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Ticket size={18} />
          </span>
          App Ingresso
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {!isStaff && (
            <Link href="/eventos" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">
              Eventos
            </Link>
          )}
          {user ? (
            <>
              {!isStaff && (
                <Link href="/minha-conta" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">
                  Minha conta
                </Link>
              )}
              {user.profile.role === "ADMIN" && (
                <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">
                  Admin
                </Link>
              )}
              {(user.profile.role === "ADMIN" || user.profile.role === "CHECKIN") && (
                <Link href="/checkin" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">
                  Check-in
                </Link>
              )}
              <form action={signOutAction}>
                <button type="submit" className="btn-ghost">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
