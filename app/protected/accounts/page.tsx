import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";
import { createClient } from "@/lib/supabase/server";
import { AccountsList } from "@/components/mibolsillo/accounts-list";
import { createAccount } from "@/app/protected/accounts/actions";

const BANKS = [
  { code: "bancoestado", name: "BancoEstado" },
  { code: "falabella",   name: "Banco Falabella" },
  { code: "banco_chile", name: "Banco de Chile" },
  { code: "santander",   name: "Santander" },
  { code: "bci",         name: "BCI" },
  { code: "scotiabank",  name: "Scotiabank" },
  { code: "itau",        name: "Itaú" },
  { code: "otro",        name: "Otro / Efectivo" },
];

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  const cuentas = accounts ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <ProtectedShell>
        <section className="bg-card rounded-2xl p-3 shadow-lg border border-border">
          <h2 className="text-xs font-semibold mb-2">Nueva cuenta rápida</h2>
          <form className="flex flex-col gap-3" action={createAccount}>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Banco</label>
              <select
                name="bank_code"
                className="text-[11px] rounded-lg px-2 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                defaultValue=""
                required
              >
                <option value="" disabled>Selecciona un banco</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Tipo de cuenta</label>
              <select
                name="tipo"
                className="text-[11px] rounded-lg px-2 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                defaultValue=""
                required
              >
                <option value="" disabled>Selecciona un tipo</option>
                <option value="cuenta_corriente">Cuenta corriente</option>
                <option value="cuenta_vista">Cuenta vista / Rut</option>
                <option value="cuenta_ahorro">Cuenta de ahorro</option>
                <option value="efectivo">Efectivo</option>
                <option value="otra">Otra</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Nombre (opcional)</label>
              <input
                name="nombre"
                placeholder="Ej: Cuenta sueldo, Billetera..."
                className="text-xs rounded-lg px-2 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Saldo inicial (CLP)</label>
              <input
                name="saldo_inicial"
                type="number"
                step="1000"
                placeholder="0"
                className="text-xs rounded-lg px-2 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>

            <button
              type="submit"
              className="mt-1 w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-full hover:bg-primary/90 transition"
            >
              Guardar cuenta
            </button>
          </form>
        </section>

        <AccountsList cuentas={cuentas as any[]} />
      </ProtectedShell>
    </main>
  );
}