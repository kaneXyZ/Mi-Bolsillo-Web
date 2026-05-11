/**
 * Catálogo estático de bancos, tipos de cuenta y productos crediticios.
 * Es la única fuente de verdad. Nunca se persiste en DB; se usa en
 * formularios y para validación en server actions.
 */

export type TipoCuenta = {
  value: string;
  label: string;
};

export type ProductoCrediticio = {
  value: string;          // clave interna
  label: string;          // nombre visible
  defaultCupo?: number;   // cupo sugerido (opcional)
};

export type BankDef = {
  code: string;
  name: string;
  cuentas: TipoCuenta[];
  productos: ProductoCrediticio[];
};

export const BANK_CATALOG: BankDef[] = [
  {
    code: "bancoestado",
    name: "BancoEstado",
    cuentas: [
      { value: "cuenta_rut",       label: "Cuenta RUT" },
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
      { value: "chequera_electronica", label: "Chequera electrónica" },
    ],
    productos: [
      { value: "tc_mastercard_be",    label: "Mastercard BancoEstado" },
      { value: "tc_visa_be",          label: "Visa BancoEstado" },
      { value: "linea_credito_be",    label: "Línea de crédito" },
      { value: "credito_consumo",     label: "Crédito de consumo" },
      { value: "credito_hipotecario", label: "Crédito hipotecario" },
    ],
  },
  {
    code: "falabella",
    name: "Banco Falabella",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_cmr_verde",    label: "Tarjeta CMR Verde" },
      { value: "tc_cmr_premium",  label: "Tarjeta CMR Premium" },
      { value: "tc_cmr_elite",    label: "Tarjeta CMR Elite" },
      { value: "linea_credito",   label: "Línea de crédito" },
      { value: "credito_consumo", label: "Crédito de consumo" },
    ],
  },
  {
    code: "banco_chile",
    name: "Banco de Chile",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_vista",     label: "Cuenta vista" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_visa_chile",       label: "Visa Banco de Chile" },
      { value: "tc_mastercard_chile", label: "Mastercard Banco de Chile" },
      { value: "tc_bchile_black",     label: "Visa Black" },
      { value: "linea_credito",       label: "Línea de crédito" },
      { value: "credito_consumo",     label: "Crédito de consumo" },
      { value: "credito_hipotecario", label: "Crédito hipotecario" },
    ],
  },
  {
    code: "santander",
    name: "Santander",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_life",      label: "Cuenta Life" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_santander_visa",       label: "Visa Santander" },
      { value: "tc_santander_zero",       label: "Santander Zero" },
      { value: "tc_santander_infinite",   label: "Santander Infinite" },
      { value: "linea_credito",           label: "Línea de crédito" },
      { value: "credito_consumo",         label: "Crédito de consumo" },
      { value: "credito_hipotecario",     label: "Crédito hipotecario" },
    ],
  },
  {
    code: "bci",
    name: "BCI",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_nova",      label: "Cuenta Nova" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_bci_visa",         label: "Visa BCI" },
      { value: "tc_bci_mastercard",   label: "Mastercard BCI" },
      { value: "tc_bci_platinum",     label: "Visa Platinum BCI" },
      { value: "linea_credito",       label: "Línea de crédito" },
      { value: "credito_consumo",     label: "Crédito de consumo" },
      { value: "credito_hipotecario", label: "Crédito hipotecario" },
    ],
  },
  {
    code: "scotiabank",
    name: "Scotiabank",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_scotiabank_visa", label: "Visa Scotiabank" },
      { value: "tc_scotiabank_gold", label: "Visa Gold Scotiabank" },
      { value: "linea_credito",      label: "Línea de crédito" },
      { value: "credito_consumo",    label: "Crédito de consumo" },
    ],
  },
  {
    code: "itau",
    name: "Itaú",
    cuentas: [
      { value: "cuenta_corriente", label: "Cuenta corriente" },
      { value: "cuenta_vista",     label: "Cuenta vista" },
      { value: "cuenta_ahorro",    label: "Cuenta de ahorro" },
    ],
    productos: [
      { value: "tc_itau_visa",         label: "Visa Itaú" },
      { value: "tc_itau_mastercard",   label: "Mastercard Itaú" },
      { value: "tc_itau_platinum",     label: "Platinum Itaú" },
      { value: "linea_credito",        label: "Línea de crédito" },
      { value: "credito_consumo",      label: "Crédito de consumo" },
      { value: "credito_hipotecario",  label: "Crédito hipotecario" },
    ],
  },
];

/** Retorna la definición de un banco por código */
export function getBankDef(code: string): BankDef | undefined {
  return BANK_CATALOG.find((b) => b.code === code);
}

/** Códigos de bancos válidos (para validación server-side) */
export const VALID_BANK_CODES = new Set(BANK_CATALOG.map((b) => b.code));

/** Tipos de cuenta válidos por banco (para validación server-side) */
export function getValidAccountTypes(bankCode: string): Set<string> {
  const bank = getBankDef(bankCode);
  return new Set(bank?.cuentas.map((c) => c.value) ?? []);
}

/** Productos válidos por banco (para validación server-side) */
export function getValidProductTypes(bankCode: string): Set<string> {
  const bank = getBankDef(bankCode);
  return new Set(bank?.productos.map((p) => p.value) ?? []);
}