import Link from "next/link";
import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Entrar</h1>
          <p className="mb-6 text-sm text-gray-500">Acesse sua conta para ver seus ingressos.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <div className="mt-5 flex justify-between text-sm">
            <Link href="/esqueci-senha" className="text-brand-600 hover:underline">
              Esqueci minha senha
            </Link>
            <Link href="/cadastro" className="text-brand-600 hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
