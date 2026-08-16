"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Ticket, LogOut, Menu, X, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const COLLAPSE_STORAGE_KEY = "sidebarCollapsed";

function findActiveItem(items: SidebarItem[], pathname: string) {
  let best: SidebarItem | undefined;
  for (const item of items) {
    if (pathname === item.href) return item;
    if (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
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
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") {
      setCollapsed(true);
    }
    setReady(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const activeItem = findActiveItem(items, pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={clsx(
          "hidden shrink-0 flex-col border-r border-gray-200 bg-white md:flex",
          ready && "transition-[width] duration-200 ease-in-out",
          collapsed ? "md:w-[72px]" : "md:w-[260px]"
        )}
      >
        <SidebarContent items={items} title={title} collapsed={collapsed} pathname={pathname} />
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir menu" : undefined}
            className={clsx(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && "Recolher"}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Ticket size={18} />
                </span>
                {title}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent
              items={items}
              title={title}
              collapsed={false}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              hideHeader
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 text-sm">
            <span className="text-gray-400">{title}</span>
            {activeItem && (
              <>
                <span className="text-gray-300"> / </span>
                <span className="font-medium text-gray-900">{activeItem.label}</span>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  title,
  collapsed,
  pathname,
  onNavigate,
  hideHeader,
}: {
  items: SidebarItem[];
  title: string;
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  hideHeader?: boolean;
}) {
  const activeItem = findActiveItem(items, pathname);

  return (
    <>
      {!hideHeader && (
        <div
          className={clsx(
            "flex items-center gap-2 border-b border-gray-100 px-5 py-4 font-semibold text-gray-900",
            collapsed && "justify-center px-0"
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Ticket size={18} />
          </span>
          {!collapsed && <span className="truncate">{title}</span>}
        </div>
      )}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item === activeItem || (activeItem === undefined && item.href === pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <form action={signOutAction} className={clsx("border-t border-gray-100 p-3", collapsed && "px-2")}>
        <button
          type="submit"
          title={collapsed ? "Sair" : undefined}
          className={clsx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && "Sair"}
        </button>
      </form>
    </>
  );
}
