import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Recuperar senha</h1>
          <p className="mb-6 text-sm text-gray-500">Enviaremos um link para você redefinir sua senha.</p>
          <ForgotPasswordForm />
          <p className="mt-5 text-center text-sm text-gray-500">
            <Link href="/login" className="text-brand-600 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
