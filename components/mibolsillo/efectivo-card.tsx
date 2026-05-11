"use client";

type Props = {
  saldo: number;
  nombre?: string;
};

function formatCLP(v: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function EfectivoCard({ saldo, nombre = "Efectivo" }: Props) {
  return (
    <div className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 to-amber-900/30 p-5 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
              {nombre}
            </p>
            <p className="text-[10px] text-amber-500/70">Cuenta de efectivo</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-amber-500/60 border border-amber-500/20 rounded-full px-2 py-0.5">
          <LockIcon />
          Sistema
        </span>
      </div>

      {/* Saldo */}
      <div>
        <p className="text-[10px] text-amber-500/60 uppercase tracking-wider mb-0.5">
          Saldo disponible
        </p>
        <p className="text-2xl font-bold text-amber-300 tabular-nums">
          {formatCLP(saldo)}
        </p>
      </div>

      {/* Footer info */}
      <p className="text-[10px] text-amber-600/50 border-t border-amber-500/10 pt-2">
        Los movimientos en efectivo se categorizan aquí automáticamente
      </p>
    </div>
  );
}