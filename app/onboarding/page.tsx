import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.preguntas_completadas) {
    redirect("/protected");
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Bienvenido a Mi Bolsillo</h1>
        <p className="mb-4 text-sm text-gray-600">
          Responde estas preguntas para personalizar tu experiencia.
        </p>

        <form
          className="flex flex-col gap-3"
          action={async (formData) => {
            "use server";
            const supabase = await createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              redirect("/auth/login");
            }

            const rut = formData.get("rut") as string;
            const nombre = formData.get("nombre") as string;
            const edad = Number(formData.get("edad"));
            const trabajo = formData.get("trabajo") as string;
            const oficio = formData.get("oficio") as string;
            const salario_mensual = Number(formData.get("salario_mensual"));

            await supabase
              .from("profiles")
              .update({
                rut,
                nombre,
                edad,
                trabajo,
                oficio,
                salario_mensual,
                preguntas_completadas: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            redirect("/protected");
          }}
        >
          <input
            name="rut"
            placeholder="RUT"
            className="border p-2 rounded"
            required
          />
          <input
            name="nombre"
            placeholder="Nombre completo"
            className="border p-2 rounded"
            required
          />
          <input
            name="edad"
            type="number"
            placeholder="Edad"
            className="border p-2 rounded"
            required
          />
          <input
            name="trabajo"
            placeholder="Trabajo (empresa / rubro)"
            className="border p-2 rounded"
          />
          <input
            name="oficio"
            placeholder="Oficio (desarrollador, técnico, etc.)"
            className="border p-2 rounded"
          />
          <input
            name="salario_mensual"
            type="number"
            placeholder="Salario mensual aproximado"
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white py-2 rounded font-semibold"
          >
            Guardar y continuar
          </button>
        </form>
      </div>
    </main>
  );
}