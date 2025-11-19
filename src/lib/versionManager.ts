import { supabase } from "@/integrations/supabase/client";

export const incrementVersion = async (changes: string) => {
  try {
    const { data: currentVersion } = await supabase
      .from("dashboard_versions")
      .select("version")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!currentVersion) return;

    const [major, minor] = currentVersion.version.split(".").map(Number);
    const newVersion = `${major}.${minor + 1}`;

    const { error } = await supabase
      .from("dashboard_versions")
      .insert({ version: newVersion, changes });

    if (error) throw error;
    
    console.log(`Dashboard upgraded to v${newVersion}`);
    return newVersion;
  } catch (err) {
    console.error("Failed to increment version:", err);
  }
};
