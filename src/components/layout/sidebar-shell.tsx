import Link from "next/link";
import { Ticket, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarShell({
  items,
  title,
  children,
}: {
  items: SidebarItem[];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Ticket size={18} />
          </span>
          {title}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="border-t border-gray-100 p-3">
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
            <LogOut size={18} />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <MobileNav items={items} title={title} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function MobileNav({ items, title }: { items: SidebarItem[]; title: string }) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <p className="mb-2 text-sm font-semibold text-gray-900">{title}</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
