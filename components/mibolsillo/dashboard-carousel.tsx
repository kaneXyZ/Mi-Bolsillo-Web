"use client";
import { useEffect, useRef, useState } from "react";

type Account = {
  id: number;
  bank_code: string | null;
  nombre: string | null;
  tipo: string;
  saldo_actual: number;
  deuda_actual?: number | null;
};

type Credito = {
  id: number;
  nombre: string | null;
  tipo: string | null;
  deuda_actual: number | null;
  cuota_mensual?: number | null;
  bank_code?: string | null;
};

type Props = {
  cuentas: Account[];
  creditos?: Credito[];
};

/* ─── Helpers ─── */
function formatCLP(v: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);
}

function tipoCuentaLabel(tipo: string) {
  const map: Record<string, string> = {
    corriente: "Cuenta corriente",
    vista: "Cuenta vista",
    ahorro: "Cuenta de ahorro",
    tarjeta_credito: "Tarjeta de crédito",
  };
  return map[tipo] ?? tipo;
}

/* ─── Paleta monocromática por banco ─── */
const BANK_PALETTE: Record<
  string,
  { label: string; from: string; to: string; border: string; text: string; muted: string; chip: string; dot: string }
> = {
  banco_chile: {
    label: "Banco de Chile",
    from: "#0a1a3d", to: "#0d2866",
    border: "#1a3a80", text: "#a8c4ff",
    muted: "#4a6fa5", chip: "#1a3a80", dot: "#5b8fff",
  },
  santander: {
    label: "Santander",
    from: "#3d0000", to: "#660000",
    border: "#8b0000", text: "#ffb3b3",
    muted: "#a55050", chip: "#8b0000", dot: "#ff5555",
  },
  bci: {
    label: "BCI",
    from: "#001f2d", to: "#003348",
    border: "#005c7a", text: "#7ecfea",
    muted: "#3a7f96", chip: "#005c7a", dot: "#3bbde0",
  },
  scotiabank: {
    label: "Scotiabank",
    from: "#2d0010", to: "#4a001a",
    border: "#7a0028", text: "#ffaac4",
    muted: "#9a4060", chip: "#7a0028", dot: "#ff4488",
  },
  itau: {
    label: "Itaú",
    from: "#2d1200", to: "#4a2000",
    border: "#7a3800", text: "#ffcc88",
    muted: "#9a6030", chip: "#7a3800", dot: "#ff9922",
  },
  bbva: {
    label: "BBVA",
    from: "#001244", to: "#001f6e",
    border: "#0033b3", text: "#99b8ff",
    muted: "#3355aa", chip: "#0033b3", dot: "#4477ff",
  },
  /* BancoEstado → naranja monocromático */
  bancoestado: {
    label: "BancoEstado",
    from: "#2d1100", to: "#4a1e00",
    border: "#7a3300", text: "#ffbb66",
    muted: "#9a5530", chip: "#7a3300", dot: "#ff8800",
  },
  /* Falabella → verde monocromático */
  falabella: {
    label: "Falabella",
    from: "#0a2200", to: "#163800",
    border: "#285200", text: "#aaee66",
    muted: "#4a7a20", chip: "#285200", dot: "#66cc00",
  },
  ripley: {
    label: "Ripley",
    from: "#1a0033", to: "#2d0055",
    border: "#550099", text: "#cc99ff",
    muted: "#7a44aa", chip: "#550099", dot: "#9944ff",
  },
  default: {
    label: "Cuenta",
    from: "#111827", to: "#1f2937",
    border: "#374151", text: "#e5e7eb",
    muted: "#9ca3af", chip: "#374151", dot: "#9ca3af",
  },
};

function getBankPalette(code?: string | null) {
  if (!code) return BANK_PALETTE.default;
  return BANK_PALETTE[code.toLowerCase()] ?? BANK_PALETTE.default;
}

/* ─── BankCard ─── */
function BankCard(props: {
  nombre: string;
  tipo: string;
  bank_code: string | null;
  saldo?: number;
  deuda?: number;
  esCredito?: boolean;
}) {
  const { nombre, tipo, bank_code, saldo, deuda, esCredito } = props;
  const p = getBankPalette(bank_code);

  return (
    <div
      className="relative shrink-0 w-[260px] rounded-2xl p-4 flex flex-col gap-3 shadow-lg overflow-hidden select-none"
      style={{
        background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)`,
        border: `1px solid ${p.border}`,
      }}
    >
      {/* orbe decorativo */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: p.dot, transform: "translate(40%,-40%)" }}
      />

      {/* cabecera */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: p.muted }}>
            {p.label !== "Cuenta" ? p.label : tipoCuentaLabel(tipo)}
          </p>
          <p className="text-xs font-bold mt-0.5" style={{ color: p.text }}>{nombre}</p>
        </div>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: p.chip, color: p.text }}
        >
          {tipoCuentaLabel(tipo)}
        </span>
      </div>

      {/* montos */}
      <div className="relative z-10">
        {saldo !== undefined && !esCredito && (
          <>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: p.muted }}>
              Saldo disponible
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: p.text }}>
              {formatCLP(saldo)}
            </p>
          </>
        )}
        {deuda !== undefined && deuda > 0 && (
          <div className="mt-1">
            <p className="text-[9px] uppercase tracking-wider" style={{ color: p.muted }}>
              {esCredito ? "Deuda total" : "Deuda asociada"}
            </p>
            <p className="text-sm font-semibold text-red-300 tabular-nums">
              {formatCLP(deuda)}
            </p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center gap-1.5 mt-auto relative z-10">
        <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
        <span className="text-[9px]" style={{ color: p.muted }}>
          {bank_code ? p.label : "Sin banco asignado"}
        </span>
      </div>
    </div>
  );
}

/* ─── Carrusel principal ─── */
export function DashboardCarousel({ cuentas, creditos = [] }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  /* Construcción de cards — SOLO cuentas + créditos, sin Resumen global */
  const cardCount = cuentas.length + creditos.length;

  /* Sincronizar dot con scroll real (funciona en PC y móvil) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const CARD_W = 260 + 12; // width + gap-3

    function onScroll() {
      const i = Math.round(el!.scrollLeft / CARD_W);
      setActiveIdx(i);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToIndex(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    const CARD_W = 260 + 12;
    el.scrollTo({ left: i * CARD_W, behavior: "smooth" });
    setActiveIdx(i);
  }

  if (cardCount === 0) return null;

  return (
    <div className="w-full select-none">
      {/* Track con scroll-snap */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",        /* Firefox */
          msOverflowStyle: "none",       /* IE */
        }}
      >
        {/* ocultar scrollbar en Chrome/Safari */}
        <style>{`.snap-scroll::-webkit-scrollbar{display:none}`}</style>

        {cuentas.map((c) => (
          <div key={`cta-${c.id}`} style={{ scrollSnapAlign: "start" }}>
            <BankCard
              nombre={c.nombre ?? tipoCuentaLabel(c.tipo)}
              tipo={c.tipo}
              bank_code={c.bank_code}
              saldo={Number(c.saldo_actual ?? 0)}
              deuda={Number(c.deuda_actual ?? 0)}
            />
          </div>
        ))}

        {creditos.map((cr) => (
          <div key={`cr-${cr.id}`} style={{ scrollSnapAlign: "start" }}>
            <BankCard
              nombre={cr.nombre ?? "Crédito"}
              tipo={cr.tipo ?? "tarjeta_credito"}
              bank_code={cr.bank_code ?? null}
              deuda={Number(cr.deuda_actual ?? 0)}
              esCredito
            />
          </div>
        ))}
      </div>

      {/* Dots sincronizados */}
      {cardCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: cardCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir a tarjeta ${i + 1}`}
              className={`rounded-full transition-all ${
                i === activeIdx
                  ? "w-4 h-1.5 bg-primary"
                  : "w-1.5 h-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}