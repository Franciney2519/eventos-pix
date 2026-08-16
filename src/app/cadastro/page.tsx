import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { SignUpForm } from "@/features/auth/components/signup-form";

export default function SignUpPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Criar conta</h1>
          <p className="mb-6 text-sm text-gray-500">Cadastre-se para comprar ingressos.</p>
          <SignUpForm />
          <p className="mt-5 text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
