import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[12%] h-[380px] w-[540px] rounded-full bg-indigo-600/15 blur-[130px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[820px] items-center justify-between gap-3 px-5 pb-4 pt-6">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            <QrCode className="h-4.5 w-4.5 text-white" />
          </div>
          <p className="text-[15px] font-semibold tracking-tight">QR Atelier</p>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3 w-3" /> Back to studio
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[820px] flex-1 px-5 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-zinc-500">Last updated {updated}</p>
        <div className="legal-prose mt-8">{children}</div>
      </main>
    </div>
  );
}
