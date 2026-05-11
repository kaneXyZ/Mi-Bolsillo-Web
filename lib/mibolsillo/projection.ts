// lib/mibolsillo/projection.ts

export type TxForProjection = {
  fecha: string;
  tipo: "ingreso" | "gasto";
  monto: number;
  category_id: number | null;
};

export type CatForProjection = {
  id: number;
  tipo: "ingreso" | "gasto";
  is_fixed: boolean;
};

export type ProfileForProjection = {
  ingreso_mensual_declarado?: number | null;
  gasto_fijo_mensual_declarado?: number | null;
  gasto_variable_mensual_estimado?: number | null;
};

export type MonthBreakdown = {
  label: string;        // "Ene", "Feb", etc.
  año: number;
  mes: number;          // 0-11
  ingresoFijo: number;
  ingresoVariable: number;
  gastoFijo: number;
  gastoVariable: number;
  neto: number;         // ingresos - gastos del mes
};

export type ProyeccionResult = {
  saldoProyectado: number;
  ingresosMesFijos: number;
  ingresosMesVariables: number;
  gastosMesFijos: number;
  gastosMesVariables: number;
  historial: MonthBreakdown[];   // últimos 3 meses + mes actual
  promedioIngresoFijo: number;   // promedio de ingresos fijos históricos
};

const MESES = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function desglosarMes(
  trans: TxForProjection[],
  cats: CatForProjection[],
  year: number,
  month: number
): Pick<MonthBreakdown, "ingresoFijo" | "ingresoVariable" | "gastoFijo" | "gastoVariable"> {
  const filtradas = trans.filter((t) => {
    const f = new Date(t.fecha);
    return f.getFullYear() === year && f.getMonth() === month;
  });

  let ingresoFijo = 0;
  let ingresoVariable = 0;
  let gastoFijo = 0;
  let gastoVariable = 0;

  for (const t of filtradas) {
    const cat = cats.find((c) => c.id === t.category_id);
    const isFixed = cat?.is_fixed ?? false;

    if (t.tipo === "ingreso") {
      if (isFixed) ingresoFijo += t.monto;
      else ingresoVariable += t.monto;
    } else {
      if (isFixed) gastoFijo += t.monto;
      else gastoVariable += t.monto;
    }
  }

  return { ingresoFijo, ingresoVariable, gastoFijo, gastoVariable };
}

export function calcularProyeccion(
  hoy: Date,
  saldoActual: number,
  trans: TxForProjection[],
  cats: CatForProjection[],
  perfil: ProfileForProjection
): ProyeccionResult {
  // Construir historial: hasta 3 meses anteriores + mes actual
  const historial: MonthBreakdown[] = [];

  for (let i = 3; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const desglose = desglosarMes(trans, cats, year, month);

    historial.push({
      label: MESES[month],
      año: year,
      mes: month,
      ...desglose,
      neto: desglose.ingresoFijo + desglose.ingresoVariable - desglose.gastoFijo - desglose.gastoVariable,
    });
  }

  // Promedio de ingresos fijos de los 3 meses anteriores (excluyendo mes actual)
  const historicos = historial.slice(0, 3).filter((m) => m.ingresoFijo > 0);
  let promedioIngresoFijo = 0;

  if (historicos.length > 0) {
    promedioIngresoFijo =
      historicos.reduce((acc, m) => acc + m.ingresoFijo, 0) / historicos.length;
  } else {
    // fallback: lo declarado por el usuario en su perfil
    promedioIngresoFijo = perfil.ingreso_mensual_declarado ?? 0;
  }

  // Mes actual (último item del historial)
  const mesActual = historial[historial.length - 1];

  // Fallback de gastos si no hay historial en mes actual
  const gastosFijosUsados =
    mesActual.gastoFijo > 0
      ? mesActual.gastoFijo
      : (perfil.gasto_fijo_mensual_declarado ?? 0);

  const gastosVariablesUsados =
    mesActual.gastoVariable > 0
      ? mesActual.gastoVariable
      : (perfil.gasto_variable_mensual_estimado ?? 0);

  // Ingresos mes actual: lo registrado + si faltan ingresos fijos, usamos promedio
  const ingresosFijosUsados =
    mesActual.ingresoFijo > 0 ? mesActual.ingresoFijo : promedioIngresoFijo;

  const saldoProyectado =
    saldoActual +
    ingresosFijosUsados +
    mesActual.ingresoVariable -
    gastosFijosUsados -
    gastosVariablesUsados;

  return {
    saldoProyectado,
    ingresosMesFijos: ingresosFijosUsados,
    ingresosMesVariables: mesActual.ingresoVariable,
    gastosMesFijos: gastosFijosUsados,
    gastosMesVariables: gastosVariablesUsados,
    historial,
    promedioIngresoFijo,
  };
}