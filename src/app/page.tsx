import Link from "next/link";
import { CalendarCheck, QrCode, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Gerencie eventos, inscrições e check-in em um só lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Pagamento via PIX com aprovação manual, ingressos com QR Code exclusivo e leitura rápida na entrada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/eventos" className="btn-primary px-6 py-3 text-base">
              Ver eventos disponíveis
            </Link>
            <Link href="/cadastro" className="btn-secondary px-6 py-3 text-base">
              Criar conta
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-20 sm:grid-cols-3 sm:px-6">
          <Feature
            icon={CalendarCheck}
            title="Inscrição simples"
            description="Escolha a quantidade, veja o valor total e envie o comprovante em segundos."
          />
          <Feature
            icon={ShieldCheck}
            title="Aprovação segura"
            description="Cada pagamento é conferido manualmente antes da emissão dos ingressos."
          />
          <Feature
            icon={QrCode}
            title="Check-in por QR Code"
            description="Cada ingresso tem um código único, validado instantaneamente na entrada."
          />
        </section>
      </main>
    </>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-left">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}
