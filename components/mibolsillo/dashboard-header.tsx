"use client";

type DashboardHeaderProps = {
  nombre?: string | null;
  onMenuClick?: () => void;
};

export function DashboardHeader({ nombre, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between py-2">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mi Bolsillo</h1>
        <p className="text-xs text-muted-foreground">
          Hola {nombre || "usuario"}
        </p>
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded-full bg-card border border-slate-700 text-lg"
      >
        ☰
      </button>
    </header>
  );
}