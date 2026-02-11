
-- Create product_sizes table
CREATE TABLE public.product_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL CHECK (size IN ('S', 'M', 'L')),
  price numeric NOT NULL,
  original_price numeric,
  stock_quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (product_id, size)
);

-- Enable RLS
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- Anyone can view product sizes
CREATE POLICY "Anyone can view product sizes"
ON public.product_sizes FOR SELECT
USING (true);

-- Admins can manage product sizes
CREATE POLICY "Admins can insert product sizes"
ON public.product_sizes FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update product sizes"
ON public.product_sizes FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete product sizes"
ON public.product_sizes FOR DELETE
USING (is_admin(auth.uid()));
