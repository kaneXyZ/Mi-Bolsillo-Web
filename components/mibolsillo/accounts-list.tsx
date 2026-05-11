"use client";

import { useState } from "react";
import { updateAccount } from "@/app/protected/accounts/actions";

const BANKS = [
  { code: "bancoestado", name: "BancoEstado", emoji: "🟠" },
  { code: "falabella", name: "Banco Falabella", emoji: "🟢" },
  { code: "banco_chile", name: "Banco de Chile", emoji: "🔵" },
  { code: "santander", name: "Santander", emoji: "🟥" },
  { code: "bci", name: "BCI", emoji: "🟧" },
  { code: "scotiabank", name: "Scotiabank", emoji: "🟥" },
  { code: "itau", name: "Itaú", emoji: "🟨" },
  { code: "otro", name: "Otro / Efectivo", emoji: "🏦" },
];

function getBankVisualByCode(code?: string | null) {
  return BANKS.find((b) => b.code === code) ?? { code: "otro", name: "Banco / Efectivo", emoji: "🏦" };
}

function getTipoLabel(tipo: string) {
  switch (tipo) {
    case "cuenta_corriente": return "Cuenta corriente";
    case "cuenta_vista":     return "Cuenta vista / Rut";
    case "cuenta_ahorro":    return "Cuenta de ahorro";
    case "efectivo":         return "Efectivo";
    default:                 return "Otra";
  }
}

function formatCurrencyCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

type Account = {
  id: number;
  bank_code: string | null;
  nombre: string | null;
  tipo: string;
  saldo_actual: number | null;
  deuda_actual?: number | null;
  limite_linea_credito?: number | null;
  deuda_linea_credito?: number | null;
  costo_mantencion_mensual?: number | null;
  moneda_mantencion?: string | null;
};

export function AccountsList({ cuentas }: { cuentas: Account[] }) {
  const [selected, setSelected] = useState<Account | null>(null);

  return (
    <>
      <section className="bg-card rounded-2xl p-3 shadow-lg border border-border">
        <h2 className="text-xs font-semibold mb-2">Tus cuentas</h2>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {cuentas.map((cta) => {
            const bank = getBankVisualByCode(cta.bank_code);
            const tipoLabel = getTipoLabel(cta.tipo);
            return (
              <div
                key={cta.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-base">
                    {bank.emoji}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {cta.nombre || tipoLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {bank.name} · {tipoLabel}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="block font-semibold text-brand-400 text-[11px]">
                    {formatCurrencyCLP(Number(cta.saldo_actual || 0))}
                  </span>
                  {cta.deuda_actual && Number(cta.deuda_actual) > 0 && (
                    <span className="block text-[10px] text-rose-400">
                      Deuda: {formatCurrencyCLP(Number(cta.deuda_actual))}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(cta)}
                    className="text-[10px] px-2 py-1 rounded-full bg-secondary border border-border text-muted-foreground hover:border-primary/70"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            );
          })}
          {cuentas.length === 0 && (
            <span className="text-[11px] text-muted-foreground">
              Aún no tienes cuentas. Crea tu primera cuenta arriba.
            </span>
          )}
        </div>
      </section>

      {selected && (
        <AccountDetailsModal
          account={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function AccountDetailsModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const bank = getBankVisualByCode(account.bank_code);
  const tipoLabel = getTipoLabel(account.tipo);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-md bg-card rounded-t-3xl p-4 pb-6 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-base">
              {bank.emoji}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                {account.nombre || tipoLabel}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {bank.name} · {tipoLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
        </div>

        <form className="flex flex-col gap-3" action={updateAccount}>
          <input type="hidden" name="account_id" value={account.id} />

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold">Línea de crédito</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground">Límite total</label>
                <input
                  type="number"
                  name="limite_linea_credito"
                  defaultValue={account.limite_linea_credito ?? ""}
                  className="text-[11px] rounded-lg px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground">Deuda actual</label>
                <input
                  type="number"
                  name="deuda_linea_credito"
                  defaultValue={account.deuda_linea_credito ?? ""}
                  className="text-[11px] rounded-lg px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold">Mantención mensual</span>
            <div className="grid grid-cols-[1.2fr,0.8fr] gap-2">
              <input
                type="number"
                name="costo_mantencion_mensual"
                placeholder="0"
                defaultValue={account.costo_mantencion_mensual ?? ""}
                className="text-[11px] rounded-lg px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              <select
                name="moneda_mantencion"
                defaultValue={account.moneda_mantencion || "CLP"}
                className="text-[11px] rounded-lg px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <option value="CLP">CLP</option>
                <option value="UF">UF</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 w-full bg-primary/80 text-primary-foreground text-xs font-semibold py-2 rounded-full hover:bg-primary transition"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}