"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, ReactNode, useMemo } from "react";
import Link from "next/link";

type ProtectedShellProps = {
  userName?: string | null;
  children: ReactNode;
};

export function ProtectedShell({ userName, children }: ProtectedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { title, subtitle, canGoBack, backHref } = useMemo(() => {
    if (pathname.startsWith("/protected/accounts")) {
      return {
        title: "Cuentas bancarias",
        subtitle: "Gestiona tus bancos y saldos",
        canGoBack: true,
        backHref: "/protected",
      };
    }
    if (pathname.startsWith("/protected/categories")) {
      return {
        title: "Categorías",
        subtitle: "Configura ingresos y gastos",
        canGoBack: true,
        backHref: "/protected",
      };
    }
    if (pathname.startsWith("/protected/analytics")) {
      return {
        title: "Análisis",
        subtitle: "Tendencias y distribución",
        canGoBack: true,
        backHref: "/protected",
      };
    }
    // dashboard principal
    return {
      title: "Mi Bolsillo",
      subtitle: userName ? `Hola, ${userName} 👋` : "Tus finanzas bajo control",
      canGoBack: false,
      backHref: "",
    };
  }, [pathname, userName]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Navbar top */}
      <header className="w-full max-w-md mx-auto px-4 pt-3 pb-2 flex items-center justify-between bg-background/95 sticky top-0 z-30 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground border border-border hover:border-primary/60 transition"
              aria-label="Volver"
            >
              ←
            </button>
          )}
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/40 text-primary text-lg select-none">
            💰
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              {title}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Hamburguesa mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-full bg-secondary border border-border text-foreground text-lg sm:hidden"
          aria-label="Abrir menú"
        >
          {open ? "✕" : "☰"}
        </button>

        {/* Nav horizontal sm+ */}
        <nav className="hidden sm:flex items-center gap-2 text-[11px]">
          <NavLinkInline href="/protected"            label="Dashboard" icon="📊" />
          <NavLinkInline href="/protected/accounts"   label="Cuentas"   icon="🏦" />
          <NavLinkInline href="/protected/categories" label="Categorías" icon="🏷️" />
          <NavLinkInline href="/protected/analytics"  label="Análisis"  icon="📈" />
          <LogoutButtonMinimal />
        </nav>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 sm:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-full bg-background border-l border-border shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/40 text-primary text-base">
                  💼
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold">Menú</span>
                  <span className="text-[10px] text-muted-foreground">
                    {userName ? userName : "Mi Bolsillo"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-3 text-sm">
              <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide px-1">
                Navegación
              </p>
              <div className="flex flex-col gap-1 mb-3">
                <NavLinkDrawer
                  href="/protected"
                  label="Dashboard"
                  icon="📊"
                  description="Resumen general"
                  onClick={() => setOpen(false)}
                />
                <NavLinkDrawer
                  href="/protected/accounts"
                  label="Cuentas bancarias"
                  icon="🏦"
                  description="Saldos y deudas"
                  onClick={() => setOpen(false)}
                />
                <NavLinkDrawer
                  href="/protected/categories"
                  label="Categorías"
                  icon="🏷️"
                  description="Fijos y variables"
                  onClick={() => setOpen(false)}
                />
                <NavLinkDrawer
                  href="/protected/analytics"
                  label="Análisis"
                  icon="📈"
                  description="Tendencias y gráficos"
                  onClick={() => setOpen(false)}
                />
              </div>
            </div>

            {/* Footer drawer */}
            <div className="border-t border-border px-3 py-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Sesión iniciada
              </span>
              <LogoutButtonMinimal />
            </div>
          </div>
        </div>
      )}

      {/* Tab bar mobile fija abajo */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around px-2 py-1.5">
        <TabBarLink href="/protected"            icon="📊" label="Inicio" />
        <TabBarLink href="/protected/accounts"   icon="🏦" label="Cuentas" />
        <TabBarLink href="/protected/analytics"  icon="📈" label="Análisis" />
        <TabBarLink href="/protected/categories" icon="🏷️" label="Config" />
      </nav>

      {/* Contenido de la página — padding-bottom para la tab bar mobile */}
      <div className="w-full max-w-md mx-auto px-4 pb-24 sm:pb-8 pt-2 flex flex-col gap-4">
        {children}
      </div>
    </>
  );
}

/* ─── Componentes de navegación ─── */

function NavLinkInline({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/protected" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary text-secondary-foreground border-border hover:border-primary/60"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </Link>
  );
}

function NavLinkDrawer({
  href,
  label,
  icon,
  description,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  description: string;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/protected" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border text-xs transition ${
        active
          ? "bg-primary/10 border-primary text-primary"
          : "bg-secondary border-border text-secondary-foreground hover:border-primary/60"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="font-medium">{label}</span>
        <span className="text-[10px] text-muted-foreground">{description}</span>
      </div>
      {active && (
        <span className="ml-auto text-[10px] font-semibold text-primary">
          ●
        </span>
      )}
    </Link>
  );
}

function TabBarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/protected" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition text-center ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[9px] font-medium">{label}</span>
      {active && (
        <span className="h-0.5 w-4 rounded-full bg-primary mt-0.5" />
      )}
    </Link>
  );
}

function LogoutButtonMinimal() {
  return (
    <form action="/auth/logout" method="post" className="inline">
      <button
        type="submit"
        className="px-3 py-1 rounded-full bg-destructive/10 border border-destructive text-[11px] font-semibold text-destructive hover:bg-destructive/20 transition"
      >
        Salir
      </button>
    </form>
  );
}