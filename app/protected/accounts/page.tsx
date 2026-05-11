import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";
import { createClient } from "@/lib/supabase/server";
import { AccountsList } from "@/components/mibolsillo/accounts-list";
import { AccountsCarousel } from "@/components/mibolsillo/accounts-carousel";
import { createAccount, createCreditProduct } from "@/app/protected/accounts/actions";
import { BANK_CATALOG } from "@/components/mibolsillo/bank-catalog";
import { SmartAccountForm } from "@/components/mibolsillo/smart-account-form";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: accounts }, { data: creditProducts }] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", user.id).order("id", { ascending: true }),
    supabase.from("credit_products").select("*").eq("user_id", user.id),
  ]);

  const cuentas  = accounts       ?? [];
  const creditos = creditProducts ?? [];

  // Bancos que el usuario ya tiene al menos una cuenta
  const bankCodesConCuenta = [...new Set(cuentas.map((c: any) => c.bank_code))] as string[];
  const bancosConCuenta = BANK_CATALOG.filter((b) =>
    bankCodesConCuenta.includes(b.code)
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <ProtectedShell>
        {/* Carrusel */}
        <section className="mb-4">
          <AccountsCarousel cuentas={cuentas as any[]} creditos={creditos as any[]} />
        </section>

        {/* Formulario inteligente: nueva cuenta + producto crediticio */}
        <SmartAccountForm
          bankCatalog={BANK_CATALOG}
          bancosConCuenta={bancosConCuenta}
          cuentas={cuentas as any[]}
          createAccount={createAccount}
          createCreditProduct={createCreditProduct}
        />

        {/* Lista de cuentas existente */}
        <AccountsList cuentas={cuentas as any[]} />
      </ProtectedShell>
    </main>
  );
}