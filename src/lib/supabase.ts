import { BiryaniSpot } from "@/types/spot";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      biryani_spots: {
        Row: BiryaniSpot;
        Insert: Omit<BiryaniSpot, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<BiryaniSpot>;
      };
    };
  };
};
