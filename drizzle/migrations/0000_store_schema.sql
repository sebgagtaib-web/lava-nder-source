-- Enums
create type public.app_role as enum ('admin', 'merchant');
create type public.sales_channel as enum ('retail', 'wholesale');
create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned');
create type public.delivery_type as enum ('office', 'home');

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Profiles (merchants and owner)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  business_name text,
  wilaya_code int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Admins read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text,
  name_en text,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone reads categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  channel public.sales_channel not null default 'retail',
  name_ar text not null,
  name_fr text,
  name_en text,
  description_ar text,
  description_fr text,
  description_en text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  min_quantity int not null default 1 check (min_quantity >= 1),
  images text[] not null default '{}',
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  material text,
  stock int,
  is_bundle_eligible boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone reads active retail products" on public.products for select to anon, authenticated using (channel = 'retail' and is_active);
create policy "Active merchants read wholesale products" on public.products for select to authenticated
  using (channel = 'wholesale' and is_active and public.has_role(auth.uid(), 'merchant')
         and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active));
create policy "Admins manage products" on public.products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Product costs (owner only)
create table public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0)
);
grant select, insert, update, delete on public.product_costs to authenticated;
grant all on public.product_costs to service_role;
alter table public.product_costs enable row level security;
create policy "Admins manage costs" on public.product_costs for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Delivery rates per wilaya
create table public.delivery_rates (
  wilaya_code int primary key,
  name_ar text not null,
  name_fr text not null,
  office_price numeric(12,2) not null default 0 check (office_price >= 0),
  home_price numeric(12,2) not null default 0 check (home_price >= 0),
  office_enabled boolean not null default true,
  home_enabled boolean not null default true
);
grant select on public.delivery_rates to anon;
grant select, insert, update, delete on public.delivery_rates to authenticated;
grant all on public.delivery_rates to service_role;
alter table public.delivery_rates enable row level security;
create policy "Anyone reads delivery rates" on public.delivery_rates for select to anon, authenticated using (true);
create policy "Admins manage delivery rates" on public.delivery_rates for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Store settings (single row)
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'دار الجبس',
  tagline text,
  phone text,
  whatsapp text,
  instagram text,
  facebook text,
  bundle_min_items int not null default 3 check (bundle_min_items >= 2),
  bundle_discount_percent numeric(5,2) not null default 10 check (bundle_discount_percent >= 0 and bundle_discount_percent <= 90),
  default_wholesale_min_qty int not null default 10 check (default_wholesale_min_qty >= 1),
  updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon;
grant select, update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "Anyone reads settings" on public.store_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.store_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  channel public.sales_channel not null,
  merchant_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  wilaya_code int not null,
  wilaya_name text not null,
  commune text not null,
  address text,
  delivery_type public.delivery_type not null,
  delivery_fee numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  status public.order_status not null default 'pending',
  notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_channel_created_idx on public.orders (channel, created_at desc);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Admins manage orders" on public.orders for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Merchants read own orders" on public.orders for select to authenticated using (merchant_id = auth.uid());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  image text,
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null default 0,
  quantity int not null check (quantity > 0),
  color text,
  size text,
  in_bundle boolean not null default false
);
create index order_items_order_idx on public.order_items (order_id);
grant select, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Admins manage order items" on public.order_items for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Merchants read own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.merchant_id = auth.uid()));

-- updated_at triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();

-- Storage policies for product images (bucket created separately)
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

-- Seed: settings
insert into public.store_settings (id, store_name, tagline) values (1, 'دار الجبس', 'ديكورات جبسية مصنوعة يدوياً بحب');

-- Seed: categories
insert into public.categories (name_ar, name_fr, name_en, slug, sort_order) values
  ('مزهريات', 'Vases', 'Vases', 'vases', 1),
  ('شمعدانات', 'Bougeoirs', 'Candle holders', 'candle-holders', 2),
  ('ديكور جداري', 'Déco murale', 'Wall decor', 'wall-decor', 3),
  ('صواني وأطباق', 'Plateaux', 'Trays', 'trays', 4),
  ('منحوتات', 'Sculptures', 'Sculptures', 'sculptures', 5),
  ('أحواض نباتات', 'Cache-pots', 'Planters', 'planters', 6);

-- Seed: retail products
with c as (select id, slug from public.categories)
insert into public.products (channel, name_ar, name_fr, name_en, description_ar, description_fr, description_en, category_id, price, compare_at_price, images, colors, sizes, material, is_bundle_eligible, is_featured) values
  ('retail', 'مزهرية مضلعة', 'Vase côtelé', 'Ribbed vase', 'مزهرية جبسية بخطوط ناعمة، مصبوبة ومصقولة يدوياً لتضيف لمسة دافئة لركنك المفضل.', 'Vase en plâtre aux lignes douces, coulé et poncé à la main.', 'A softly ribbed plaster vase, hand-cast and hand-sanded.', (select id from c where slug='vases'), 2500, 2900, array['/images/products/vase-ribbed.jpg'], array['بيج','تراكوتا','أبيض'], array['صغير','متوسط','كبير'], 'جبس سيراميكي', true, true),
  ('retail', 'ثنائي الشمعدان', 'Duo de bougeoirs', 'Candle holder duo', 'شمعدانان بتصميم منحني أنيق، مثاليان لطاولة الطعام أو الرفوف.', 'Deux bougeoirs aux courbes élégantes.', 'Two elegantly curved candle holders.', (select id from c where slug='candle-holders'), 1800, null, array['/images/products/candle-holders.jpg'], array['بيج','وردي ترابي'], array[]::text[], 'جبس سيراميكي', true, true),
  ('retail', 'ميدالية جدارية', 'Médaillon mural', 'Wall medallion', 'قطعة جدارية بنقوش زهرية بارزة تمنح جدارك روحاً كلاسيكية.', 'Médaillon mural aux motifs floraux en relief.', 'A wall medallion with raised floral motifs.', (select id from c where slug='wall-decor'), 3500, null, array['/images/products/wall-medallion.jpg'], array['أبيض','بيج'], array['40 سم','60 سم'], 'جبس طبيعي', true, true),
  ('retail', 'صينية بتأثير الرخام', 'Plateau effet marbre', 'Marble-effect tray', 'صينية صغيرة للحُلي والعطور بلمسة رخامية ناعمة.', 'Petit plateau pour bijoux et parfums, effet marbre.', 'A small tray for jewelry and perfume with a marble finish.', (select id from c where slug='trays'), 2200, null, array['/images/products/tray-marble.jpg'], array['رخامي وردي','رخامي رمادي'], array[]::text[], 'جبس سيراميكي', true, false),
  ('retail', 'منحوتة وجه أنثوي', 'Buste féminin', 'Feminine bust', 'منحوتة وجه هادئة بخطوط فنية، قطعة مميزة لأي رف.', 'Buste au visage serein, pièce artistique.', 'A serene sculpted face, a statement piece.', (select id from c where slug='sculptures'), 4500, 5200, array['/images/products/bust-sculpture.jpg'], array['أبيض','تراكوتا'], array['متوسط','كبير'], 'جبس طبيعي', true, true),
  ('retail', 'حوض نبات مقوس', 'Cache-pot arche', 'Arched planter', 'حوض صغير بشكل قوس للنباتات العصارية والصبار.', 'Petit cache-pot en arche pour plantes grasses.', 'A small arched planter for succulents.', (select id from c where slug='planters'), 2000, null, array['/images/products/planter-arch.jpg'], array['بيج','تراكوتا','أخضر مريمي'], array['صغير','كبير'], 'جبس سيراميكي', true, false);

-- Seed: wholesale (unfinished) products
with c as (select id, slug from public.categories)
insert into public.products (channel, name_ar, name_fr, name_en, description_ar, description_fr, description_en, category_id, price, min_quantity, images, sizes, material) values
  ('wholesale', 'مزهرية خام (غير مطلية)', 'Vase brut (non peint)', 'Raw vase (unpainted)', 'قطعة خام جاهزة للصنفرة والتلوين حسب ذوقك.', 'Pièce brute prête à poncer et peindre.', 'Raw piece ready to sand and paint.', (select id from c where slug='vases'), 900, 10, array['/images/products/raw-pieces.jpg'], array['صغير','متوسط'], 'جبس سيراميكي'),
  ('wholesale', 'شمعدان خام', 'Bougeoir brut', 'Raw candle holder', 'شمعدان خام بدون تشطيب، مثالي لمشروع الديكور الخاص بك.', 'Bougeoir brut sans finition.', 'Unfinished candle holder.', (select id from c where slug='candle-holders'), 600, 10, array['/images/products/raw-pieces.jpg'], array[]::text[], 'جبس سيراميكي'),
  ('wholesale', 'حوض نبات خام', 'Cache-pot brut', 'Raw planter', 'حوض خام قابل للتلوين والتزيين.', 'Cache-pot brut à décorer.', 'Raw planter to decorate.', (select id from c where slug='planters'), 700, 5, array['/images/products/raw-pieces.jpg'], array['صغير','كبير'], 'جبس سيراميكي');

insert into public.product_costs (product_id, cost_price)
select id, round(price * 0.4) from public.products;

-- Seed: Algeria 58 wilayas (placeholder prices to be edited by the owner)
insert into public.delivery_rates (wilaya_code, name_ar, name_fr, office_price, home_price) values
 (1,'أدرار','Adrar',800,1200),(2,'الشلف','Chlef',450,750),(3,'الأغواط','Laghouat',550,900),(4,'أم البواقي','Oum El Bouaghi',450,750),
 (5,'باتنة','Batna',450,750),(6,'بجاية','Béjaïa',450,750),(7,'بسكرة','Biskra',550,900),(8,'بشار','Béchar',700,1100),
 (9,'البليدة','Blida',400,650),(10,'البويرة','Bouira',450,750),(11,'تمنراست','Tamanrasset',1000,1500),(12,'تبسة','Tébessa',500,800),
 (13,'تلمسان','Tlemcen',450,750),(14,'تيارت','Tiaret',450,750),(15,'تيزي وزو','Tizi Ouzou',450,750),(16,'الجزائر','Alger',350,550),
 (17,'الجلفة','Djelfa',500,850),(18,'جيجل','Jijel',450,750),(19,'سطيف','Sétif',450,750),(20,'سعيدة','Saïda',500,800),
 (21,'سكيكدة','Skikda',450,750),(22,'سيدي بلعباس','Sidi Bel Abbès',450,750),(23,'عنابة','Annaba',450,750),(24,'قالمة','Guelma',450,750),
 (25,'قسنطينة','Constantine',450,750),(26,'المدية','Médéa',450,750),(27,'مستغانم','Mostaganem',450,750),(28,'المسيلة','M''Sila',500,800),
 (29,'معسكر','Mascara',450,750),(30,'ورقلة','Ouargla',600,1000),(31,'وهران','Oran',400,700),(32,'البيض','El Bayadh',600,950),
 (33,'إليزي','Illizi',1000,1500),(34,'برج بوعريريج','Bordj Bou Arréridj',450,750),(35,'بومرداس','Boumerdès',400,650),(36,'الطارف','El Tarf',500,800),
 (37,'تندوف','Tindouf',1000,1500),(38,'تيسمسيلت','Tissemsilt',500,800),(39,'الوادي','El Oued',600,950),(40,'خنشلة','Khenchela',500,800),
 (41,'سوق أهراس','Souk Ahras',500,800),(42,'تيبازة','Tipaza',400,650),(43,'ميلة','Mila',450,750),(44,'عين الدفلى','Aïn Defla',450,750),
 (45,'النعامة','Naâma',650,1000),(46,'عين تموشنت','Aïn Témouchent',450,750),(47,'غرداية','Ghardaïa',600,950),(48,'غليزان','Relizane',450,750),
 (49,'تيميمون','Timimoun',900,1400),(50,'برج باجي مختار','Bordj Badji Mokhtar',1100,1600),(51,'أولاد جلال','Ouled Djellal',600,950),(52,'بني عباس','Béni Abbès',900,1400),
 (53,'عين صالح','In Salah',1000,1500),(54,'عين قزام','In Guezzam',1100,1600),(55,'تقرت','Touggourt',600,1000),(56,'جانت','Djanet',1100,1600),
 (57,'المغير','El M''Ghair',600,950),(58,'المنيعة','El Meniaa',700,1100);