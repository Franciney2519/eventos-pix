import { PublicHeader } from "@/components/layout/public-header";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="card">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Definir nova senha</h1>
          <p className="mb-6 text-sm text-gray-500">Escolha uma nova senha para sua conta.</p>
          <UpdatePasswordForm />
        </div>
      </main>
    </>
  );
}
