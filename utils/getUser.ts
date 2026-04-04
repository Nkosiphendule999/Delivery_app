import { supabase } from "@/SupaBase/supabase_file";

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
};

export const getUserProfile = async () => {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.log("Error fetching profile:", error.message);
    return null;
  }

  return data;
};