"use client";

import Link from "next/link";
import { useState } from "react";

type MobileNavbarProps = {
  userName?: string | null;
};

export function MobileNavbar({ userName }: MobileNavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="w-full max-w-md mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-lg">
            💰
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Mi Bolsillo
            </span>
            <span className="text-[10px] text-emerald-200/70">
              {userName ? `Hola, ${userName}` : "Tus finanzas, bajo control"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-full bg-card border border-slate-700 text-slate-100 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          aria-label="Abrir menú"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Panel deslizante */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60">
          <div className="absolute top-0 right-0 h-full w-72 max-w-full bg-background border-l border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-base">
                  💼
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold">Panel</span>
                  <span className="text-[10px] text-muted-foreground">
                    Mi Bolsillo
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 text-sm">
              <div className="mb-3">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">
                  Navegación
                </p>
                <div className="flex flex-col gap-1">
                  <NavLink href="/protected" label="Dashboard" icon="📊" />
                  <NavLink
                    href="/protected/accounts"
                    label="Cuentas bancarias"
                    icon="🏦"
                  />
                </div>
              </div>

              <div className="mb-3">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">
                  Módulos
                </p>
                <div className="flex flex-col gap-1">
                  <NavLink
                    href="/protected/modules/home-inventory"
                    label="Inventario hogar"
                    icon="🏠"
                  />
                  {/* Aquí después puedes agregar más módulos */}
                </div>
              </div>
            </div>

            <div className="border-t border-border px-3 py-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Sesión iniciada
              </span>
              <LogoutButtonMinimal />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl px-3 py-2 bg-card/60 border border-border hover:border-emerald-400/60 hover:bg-card transition"
    >
      <span className="text-base">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function LogoutButtonMinimal() {
  return (
    <form
      action="/auth/logout"
      method="post"
      className="inline"
    >
      <button
        type="submit"
        className="px-3 py-1 rounded-full bg-card border border-slate-700 text-[11px] font-semibold hover:border-red-400 hover:text-red-300 transition"
      >
        Cerrar sesión
      </button>
    </form>
  );
}