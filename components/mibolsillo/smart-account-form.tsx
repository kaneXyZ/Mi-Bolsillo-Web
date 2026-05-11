"use client";

import { useState } from "react";
import type { BankDef } from "@/components/mibolsillo/bank-catalog";

type Account = { id: number; bank_code: string; nombre: string | null; tipo: string };

type Props = {
  bankCatalog: BankDef[];
  bancosConCuenta: BankDef[];
  cuentas: Account[];
  createAccount: (fd: FormData) => Promise<void>;
  createCreditProduct: (fd: FormData) => Promise<void>;
};

const inputCls =
  "w-full rounded-xl border border-border bg-background text-foreground text-xs px-3 py-2 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition";

const labelCls = "text-[11px] text-muted-foreground font-medium";

type Tab = "cuenta" | "credito";

export function SmartAccountForm({
  bankCatalog,
  bancosConCuenta,
  cuentas,
  createAccount,
  createCreditProduct,
}: Props) {
  const [tab, setTab]                   = useState<Tab>("cuenta");

  // ── Estado formulario cuenta ──
  const [bankCodeCuenta, setBankCodeCuenta] = useState("");
  const bankDefCuenta = bankCatalog.find((b) => b.code === bankCodeCuenta);

  // ── Estado formulario crédito ──
  const [bankCodeCredito, setBankCodeCredito] = useState("");
  const [tipoProducto, setTipoProducto]       = useState("");
  const bankDefCredito = bankCatalog.find((b) => b.code === bankCodeCredito);

  // Determina si el producto seleccionado es del tipo "tarjeta"
  // (para mostrar campos extra de tarjeta: cupo, fecha corte/pago, tier, mantención)
  const esTarjeta = tipoProducto.startsWith("tc_");
  const esCreditoConsumo = tipoProducto === "credito_consumo" || tipoProducto === "credito_hipotecario";

  // Cuentas del banco seleccionado para vincular
  const cuentasDelBanco = cuentas.filter((c) => c.bank_code === bankCodeCredito);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-lg mb-4 overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-border">
        {(["cuenta", "credito"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-2.5 text-xs font-semibold transition ${
              tab === t
                ? "text-primary border-b-2 border-primary bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "cuenta" ? "🏦 Nueva cuenta" : "💳 Producto crediticio"}
          </button>
        ))}
      </div>

      <div className="p-3">

        {/* ─── TAB: Nueva cuenta ─── */}
        {tab === "cuenta" && (
          <form className="flex flex-col gap-3" action={createAccount}>
            {/* Banco */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Banco</label>
              <select
                name="bank_code"
                value={bankCodeCuenta}
                onChange={(e) => { setBankCodeCuenta(e.target.value); }}
                className={inputCls}
                required
              >
                <option value="" disabled>Selecciona un banco</option>
                {bankCatalog.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Tipo de cuenta — cascade desde banco */}
            {bankDefCuenta && (
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Tipo de cuenta</label>
                <select name="tipo" className={inputCls} defaultValue="" required>
                  <option value="" disabled>Selecciona un tipo</option>
                  {bankDefCuenta.cuentas.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Nombre (opcional)</label>
              <input
                name="nombre"
                placeholder={`Ej: Mi ${bankDefCuenta?.name ?? "cuenta"} principal`}
                className={inputCls}
              />
            </div>

            {/* Saldo inicial */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Saldo inicial (CLP)</label>
              <input
                name="saldo_inicial"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={!bankCodeCuenta}
              className="mt-1 w-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar cuenta
            </button>
          </form>
        )}

        {/* ─── TAB: Producto crediticio ─── */}
        {tab === "credito" && (
          <form className="flex flex-col gap-3" action={createCreditProduct}>

            {/* Paso 1: Banco */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Banco</label>
              {bancosConCuenta.length === 0 ? (
                <p className="text-[11px] text-muted-foreground bg-border/30 rounded-lg px-3 py-2">
                  Primero agrega al menos una cuenta bancaria.
                </p>
              ) : (
                <select
                  name="bank_code"
                  value={bankCodeCredito}
                  onChange={(e) => {
                    setBankCodeCredito(e.target.value);
                    setTipoProducto("");
                  }}
                  className={inputCls}
                  required
                >
                  <option value="" disabled>Selecciona un banco</option>
                  {bancosConCuenta.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Paso 2: Tipo de producto — cascade desde banco */}
            {bankDefCredito && (
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Tipo de producto</label>
                <select
                  name="tipo"
                  value={tipoProducto}
                  onChange={(e) => setTipoProducto(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="" disabled>Selecciona un producto</option>
                  {bankDefCredito.productos.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Paso 3: Vincular cuenta — solo cuentas del banco seleccionado */}
            {bankDefCredito && tipoProducto && (
              <div className="flex flex-col gap-1">
                <label className={labelCls}>
                  Cuenta vinculada
                  <span className="text-[10px] text-muted-foreground normal-case font-normal ml-1">
                    (del {bankDefCredito.name})
                  </span>
                </label>
                {cuentasDelBanco.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground bg-border/30 rounded-lg px-3 py-2">
                    No tienes cuentas de {bankDefCredito.name}. Agrégala primero.
                  </p>
                ) : (
                  <select name="account_id" className={inputCls} defaultValue="" required>
                    <option value="" disabled>Selecciona cuenta</option>
                    {cuentasDelBanco.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre ?? c.tipo}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Campos específicos de tarjeta de crédito */}
            {esTarjeta && tipoProducto && (
              <>
                <div className="h-px bg-border/60 my-1" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Datos de la tarjeta
                </p>

                {/* Nombre personalizado */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Nombre personalizado</label>
                  <input
                    name="nombre"
                    placeholder={`Ej: Mi ${bankDefCredito?.productos.find((p) => p.value === tipoProducto)?.label ?? "tarjeta"}`}
                    className={inputCls}
                  />
                </div>

                {/* Cupo y deuda */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Cupo total</label>
                    <input name="cupo_total" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Deuda actual</label>
                    <input name="deuda_actual" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>

                {/* Fechas corte / pago */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Fecha de corte</label>
                    <input name="fecha_corte" type="date" className={`${inputCls} [color-scheme:dark]`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Fecha de pago</label>
                    <input name="fecha_pago" type="date" className={`${inputCls} [color-scheme:dark]`} />
                  </div>
                </div>

                {/* Tier de cliente */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Tier de cliente</label>
                  <select name="client_tier" className={inputCls} defaultValue="normal">
                    <option value="normal">Normal</option>
                    <option value="premium">Premium — 50% dto. mantención</option>
                    <option value="elite">Elite — 100% dto. mantención</option>
                  </select>
                </div>

                {/* Mantención y puntos */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Mantención base (CLP)</label>
                    <input name="costo_mantencion_base" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Puntos acumulados</label>
                    <input name="puntos_acumulados" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos de crédito de consumo / hipotecario */}
            {esCreditoConsumo && tipoProducto && (
              <>
                <div className="h-px bg-border/60 my-1" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Datos del crédito
                </p>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Nombre personalizado</label>
                  <input name="nombre" placeholder="Ej: Crédito auto 2024" className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Monto original</label>
                    <input name="monto_credito_original" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Deuda actual</label>
                    <input name="deuda_actual" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Cuotas totales</label>
                    <input name="cuotas_totales" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Cuotas pagadas</label>
                    <input name="cuotas_pagadas" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Cuota mensual</label>
                    <input name="cuota_mensual" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Tasa mensual (%)</label>
                    <input name="tasa_interes_mensual" type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Fecha próximo pago</label>
                  <input name="fecha_pago" type="date" className={`${inputCls} [color-scheme:dark]`} />
                </div>
              </>
            )}

            {/* Línea de crédito */}
            {tipoProducto === "linea_credito" && tipoProducto && (
              <>
                <div className="h-px bg-border/60 my-1" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Datos de la línea
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Cupo total</label>
                    <input name="cupo_total" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Deuda actual</label>
                    <input name="deuda_actual" type="number" step="1" min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Tasa mensual (%)</label>
                  <input name="tasa_interes_mensual" type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={!bankCodeCredito || !tipoProducto || cuentasDelBanco.length === 0}
              className="mt-1 w-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar producto crediticio
            </button>
          </form>
        )}
      </div>
    </div>
  );
}