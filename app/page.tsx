import Link from "next/link";
import "./globals.css";
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-slate-50 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col items-center text-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Mi Bolsillo
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-300">
              Controla tus finanzas personales, tus cuentas bancarias y el
              inventario de tu hogar, todo desde una app web diseñada para
              usarla en el teléfono.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link
              href="/auth/login"
              className="w-full rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
            >
              Entrar a la app
            </Link>
            <p className="text-[11px] text-muted-foreground">
              Inicio de sesión con Google o email. Tus datos se guardan de forma
              segura en Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-left w-full">
            <div className="bg-card/60 rounded-xl p-3 border border-border">
              <h2 className="text-xs font-semibold mb-1">
                Finanzas personales
              </h2>
              <p className="text-[11px] text-slate-300">
                Registra ingresos y gastos con categorías personalizables,
                visualiza tu balance general y tu nivel de endeudamiento.
              </p>
            </div>
            <div className="bg-card/60 rounded-xl p-3 border border-border">
              <h2 className="text-xs font-semibold mb-1">Cuentas bancarias</h2>
              <p className="text-[11px] text-slate-300">
                Agrega tus cuentas corrientes, vista, ahorro, tarjetas de
                crédito y créditos para que Mi Bolsillo calcule todo por ti.
              </p>
            </div>
            <div className="bg-card/60 rounded-xl p-3 border border-border">
              <h2 className="text-xs font-semibold mb-1">Inventario hogar</h2>
              <p className="text-[11px] text-slate-300">
                Activa el módulo de Inventario Hogar y colabora con otra
                persona para gestionar compras y stock de productos en casa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de precios simple */}
      <section className="border-t border-border px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-center md:text-left">
            <h2 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Precio
            </h2>
            <p className="text-slate-100 mt-1">
              Beta gratuita para uso personal.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Más adelante podrás elegir planes según funciones avanzadas
              (módulos, multiusuario, etc.).
            </p>
          </div>
          <div className="text-center md:text-right text-[11px] text-slate-500">
            Desplegado en Vercel. Datos almacenados en Supabase.
          </div>
        </div>
      </section>
    </main>
  );
}