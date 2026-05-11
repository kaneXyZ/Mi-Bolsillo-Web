"use client";

import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  mode?: "login" | "signup";
};

export function GoogleAuthButton({ mode = "login" }: GoogleAuthButtonProps) {
  const handleClick = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full bg-white text-black border border-slate-300 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium"
    >
      {/* Puedes reemplazar esto por el ícono de Google si quieres */}
      <span>
        {mode === "login" ? "Iniciar sesión con Google" : "Registrarse con Google"}
      </span>
    </button>
  );
}