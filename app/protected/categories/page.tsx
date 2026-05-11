import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";
import { CategoriesList } from "@/components/mibolsillo/categories-list";
import { createCategory } from "@/app/protected/categories/actions";

// Categorías por defecto con is_fixed ya correcto
const DEFAULT_CATEGORIES = [
  { tipo: "ingreso" as const, nombre: "Salario",              is_fixed: true  },
  { tipo: "ingreso" as const, nombre: "Anticipo",             is_fixed: false },
  { tipo: "ingreso" as const, nombre: "Viático",              is_fixed: false },
  { tipo: "ingreso" as const, nombre: "Dividendos",           is_fixed: false },
  { tipo: "gasto"   as const, nombre: "Comida",               is_fixed: false },
  { tipo: "gasto"   as const, nombre: "Transporte",           is_fixed: false },
  { tipo: "gasto"   as const, nombre: "Arriendo / Dividendo", is_fixed: true  },
  { tipo: "gasto"   as const, nombre: "Servicios básicos",    is_fixed: true  },
  { tipo: "gasto"   as const, nombre: "Entretenimiento",      is_fixed: false },
];

async function initDefaultCategories(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    ...c,
  }));

  await supabase.from("categories").insert(rows);
}

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  await initDefaultCategories(user.id);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("tipo", { ascending: true });

  const cats = categories ?? [];
  const incomeCats = cats.filter((c) => c.tipo === "ingreso");
  const expenseCats = cats.filter((c) => c.tipo === "gasto");

  // Mapa para byId — lo serializamos como objeto plano para el client component
  const byId: Record<number, any> = {};
  cats.forEach((c) => {
    byId[c.id] = c;
  });

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <ProtectedShell>
        {/* Form nueva categoría */}
        <section className="bg-card rounded-2xl p-3 shadow-lg border border-border">
          <h2 className="text-xs font-semibold mb-2">Nueva categoría</h2>
          <form className="flex flex-col gap-3" action={createCategory}>
            {/* Tipo */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">
                Tipo de categoría
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2 py-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="ingreso"
                    defaultChecked
                    className="h-3 w-3 accent-emerald-500"
                  />
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Ingreso
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2 py-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="gasto"
                    className="h-3 w-3 accent-rose-400"
                  />
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                    Gasto
                  </span>
                </label>
              </div>
            </div>

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">
                Nombre de la categoría
              </label>
              <input
                name="nombre"
                placeholder="Ej: Supermercado, Freelance, Arriendo..."
                className="text-xs rounded-lg px-2 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
                required
              />
            </div>

            {/* Fijo o variable */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">
                ¿Es un ingreso/gasto fijo?
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2 py-1 cursor-pointer">
                  <input
                    type="radio"
                    name="is_fixed"
                    value="false"
                    defaultChecked
                    className="h-3 w-3"
                  />
                  <span>Variable</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2 py-1 cursor-pointer">
                  <input
                    type="radio"
                    name="is_fixed"
                    value="true"
                    className="h-3 w-3"
                  />
                  <span>Fijo</span>
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Fijo = sueldo, arriendo, suscripciones. Variable = comida,
                transporte, ocio.
              </p>
            </div>

            {/* Subcategoría */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">
                Subcategoría de (opcional)
              </label>
              <select
                name="parent_id"
                className="text-[11px] rounded-lg px-2 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                defaultValue=""
              >
                <option value="">Sin subcategoría</option>
                {expenseCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    Gasto: {cat.nombre}
                  </option>
                ))}
                {incomeCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    Ingreso: {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-1 w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-full hover:bg-primary/90 transition"
            >
              Guardar categoría
            </button>
          </form>
        </section>

        {/* Lista con edición inline (client component) */}
        <CategoriesList
          incomeCats={incomeCats as any[]}
          expenseCats={expenseCats as any[]}
          byId={byId}
        />

        <p className="text-[10px] text-muted-foreground text-center">
          Marca como "fijo" las categorías que se repiten cada mes (sueldo,
          arriendo, etc.). Esto mejora la proyección financiera.
        </p>
      </ProtectedShell>
    </main>
  );
}