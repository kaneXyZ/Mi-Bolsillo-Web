import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Parámetros 'from' y 'to' requeridos" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 1) Resumen
  const { data: summaryRows, error: summaryError } = await supabase.rpc(
    "analytics_summary",
    {
      p_user_id: user.id,
      p_from: from,
      p_to: to,
    }
  );

  if (summaryError) {
    console.error(summaryError);
    return NextResponse.json(
      { error: "Error en resumen" },
      { status: 500 }
    );
  }

  const summary = summaryRows?.[0] ?? {
    total_income: 0,
    total_expense: 0,
    balance: 0,
  };

  // 2) Serie temporal
  const { data: timeseriesRows, error: tsError } = await supabase.rpc(
    "analytics_timeseries",
    {
      p_user_id: user.id,
      p_from: from,
      p_to: to,
    }
  );

  if (tsError) {
    console.error(tsError);
    return NextResponse.json(
      { error: "Error en timeseries" },
      { status: 500 }
    );
  }

  const timeseries =
    timeseriesRows?.map((row: any) => ({
      label: row.label as string,
      income: Number(row.income || 0),
      expense: Number(row.expense || 0),
    })) ?? [];

  // 3) Gastos por categoría
  const { data: catRows, error: catError } = await supabase.rpc(
    "analytics_expense_categories",
    {
      p_user_id: user.id,
      p_from: from,
      p_to: to,
    }
  );

  if (catError) {
    console.error(catError);
    return NextResponse.json(
      { error: "Error en categorías" },
      { status: 500 }
    );
  }

  const expensesByCategory =
    catRows?.map((row: any) => ({
      label: row.category_name as string,
      amount: Number(row.total_amount || 0),
    })) ?? [];

  return NextResponse.json({
    summary,
    timeseries,
    expensesByCategory,
  });
}