-- ==========================================
-- FINAL MASTER SECURITY POLICY (STABLE)
-- ==========================================

-- 1. CLEAN SLATE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;

-- 2. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. PUBLIC READ ACCESS (Loop-Free)
DROP POLICY IF EXISTS "Public_Read_Profiles" ON public.profiles;
CREATE POLICY "Public_Read_Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public_Read_Products" ON public.products;
CREATE POLICY "Public_Read_Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public_Read_Categories" ON public.categories;
CREATE POLICY "Public_Read_Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public_Read_Images" ON public.product_images;
CREATE POLICY "Public_Read_Images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public_Read_Variants" ON public.product_variants;
CREATE POLICY "Public_Read_Variants" ON public.product_variants FOR SELECT USING (true);

-- 4. ADMIN MANAGE ACCESS (Role-Based)
DROP POLICY IF EXISTS "Admin_Manage_Products" ON public.products;
CREATE POLICY "Admin_Manage_Products" ON public.products FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin_Manage_Categories" ON public.categories;
CREATE POLICY "Admin_Manage_Categories" ON public.categories FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin_Manage_Images" ON public.product_images;
CREATE POLICY "Admin_Manage_Images" ON public.product_images FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin_Manage_Variants" ON public.product_variants;
CREATE POLICY "Admin_Manage_Variants" ON public.product_variants FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. USER ISOLATION
DROP POLICY IF EXISTS "Users_Own_Orders" ON public.orders;
CREATE POLICY "Users_Own_Orders" ON public.orders FOR ALL TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users_Own_Cart" ON public.cart_items;
CREATE POLICY "Users_Own_Cart" ON public.cart_items FOR ALL TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users_Update_Own_Profile" ON public.profiles;
CREATE POLICY "Users_Update_Own_Profile" ON public.profiles FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
