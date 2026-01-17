import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  stock_quantity: number;
  is_featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export const useProducts = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["products", categorySlug],
    queryFn: async () => {
      let query = supabase.from("products").select("*");
      
      if (categorySlug) {
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }
      
      const { data, error } = await query.order("is_featured", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      // Sort categories with "Other" always last
      const categories = data as Category[];
      return categories.sort((a, b) => {
        if (a.slug === 'other') return 1;
        if (b.slug === 'other') return -1;
        return a.name.localeCompare(b.name);
      });
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .limit(4);
      
      if (error) throw error;
      return data as Product[];
    },
  });
};
