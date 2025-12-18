-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and products (e-commerce needs public visibility)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Insert sample categories
INSERT INTO public.categories (name, slug, image_url) VALUES
  ('Running', 'running', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
  ('Basketball', 'basketball', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'),
  ('Football', 'football', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400'),
  ('Training', 'training', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400');

-- Insert sample products
INSERT INTO public.products (name, description, price, original_price, image_url, category_id, stock_quantity, is_featured) VALUES
  ('Nike Air Max 270', 'Premium running shoes with air cushioning', 159.99, 189.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', (SELECT id FROM public.categories WHERE slug = 'running'), 50, true),
  ('Adidas Ultraboost', 'Responsive boost midsole for energy return', 179.99, NULL, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', (SELECT id FROM public.categories WHERE slug = 'running'), 35, true),
  ('Basketball Pro Jersey', 'Official game jersey - breathable fabric', 89.99, 110.00, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400', (SELECT id FROM public.categories WHERE slug = 'basketball'), 100, false),
  ('Wilson Evolution Basketball', 'Indoor game ball - premium leather', 69.99, NULL, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400', (SELECT id FROM public.categories WHERE slug = 'basketball'), 75, true),
  ('Nike Football Cleats', 'Professional grade football cleats', 129.99, 149.99, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', (SELECT id FROM public.categories WHERE slug = 'football'), 40, false),
  ('Training Resistance Bands', 'Complete set for home workouts', 29.99, 39.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400', (SELECT id FROM public.categories WHERE slug = 'training'), 200, false),
  ('Dumbbell Set 20kg', 'Adjustable weights for strength training', 149.99, NULL, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', (SELECT id FROM public.categories WHERE slug = 'training'), 30, true),
  ('Pro Running Shorts', 'Lightweight moisture-wicking shorts', 45.99, 55.00, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400', (SELECT id FROM public.categories WHERE slug = 'running'), 120, false);