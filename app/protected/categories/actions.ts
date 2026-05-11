"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const tipo = formData.get("tipo") as "ingreso" | "gasto";
  const nombre = (formData.get("nombre") as string)?.trim();
  const isFixed = formData.get("is_fixed") === "true";
  const parentId = formData.get("parent_id")
    ? Number(formData.get("parent_id"))
    : null;

  if (!tipo || !nombre) redirect("/protected/categories");

  await supabase.from("categories").insert({
    user_id: user.id,
    tipo,
    nombre,
    is_fixed: isFixed,
    parent_id: parentId,
  });

  redirect("/protected/categories");
}

export async function updateCategoryFixed(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const categoryId = Number(formData.get("category_id"));
  const isFixed = formData.get("is_fixed") === "true";

  await supabase
    .from("categories")
    .update({ is_fixed: isFixed })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  redirect("/protected/categories");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const categoryId = Number(formData.get("category_id"));
  if (!categoryId) redirect("/protected/categories");

  // 1. Desvincular transacciones que usen esta categoría
  await supabase
    .from("transactions")
    .update({ category_id: null })
    .eq("category_id", categoryId)
    .eq("user_id", user.id);

  // 2. Desvincular subcategorías que la tengan como padre
  await supabase
    .from("categories")
    .update({ parent_id: null })
    .eq("parent_id", categoryId)
    .eq("user_id", user.id);

  // 3. Ahora sí borrar sin conflicto de FK
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteCategory] error:", error.message, error.code);
  }

  redirect("/protected/categories");
}