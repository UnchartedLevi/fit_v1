import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?next=/admin");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") redirect("/");

  return { supabase, user };
}
