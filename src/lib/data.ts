import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RELATIONS = ["Self", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandparent", "Other"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const membersQuery = queryOptions({
  queryKey: ["members"],
  queryFn: async () => {
    const { data, error } = await supabase.from("family_members").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
});

export const recordsQuery = queryOptions({
  queryKey: ["records"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("medical_records")
      .select("*, family_members(member_name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});
