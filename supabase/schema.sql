-- ============================================================
-- TallerPro - Schema de Base de Datos
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TIPOS ENUM
-- ============================================================

create type user_role as enum ('client', 'mechanic', 'admin');
create type work_order_status as enum ('received', 'diagnosing', 'repairing', 'ready', 'delivered');
create type work_order_item_type as enum ('labor', 'part');
create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type vehicle_sale_status as enum ('available', 'reserved', 'sold');
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected');
create type invoice_status as enum ('draft', 'sent', 'paid');
create type transmission_type as enum ('manual', 'automatic', 'cvt');
create type fuel_type_enum as enum ('gasoline', 'diesel', 'electric', 'hybrid', 'lpg');

-- ============================================================
-- TABLA: profiles
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  phone       text,
  role        user_role not null default 'client',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Trigger: crear perfil automaticamente al registrar usuario en auth
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TABLA: vehicles
-- ============================================================

create table vehicles (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  brand      text not null,
  model      text not null,
  year       smallint not null check (year >= 1900 and year <= 2100),
  plate      text,
  color      text,
  vin        text unique,
  mileage    integer check (mileage >= 0),
  notes      text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: work_orders
-- ============================================================

create table work_orders (
  id                  uuid primary key default uuid_generate_v4(),
  vehicle_id          uuid not null references vehicles(id) on delete restrict,
  client_id           uuid not null references profiles(id) on delete restrict,
  mechanic_id         uuid references profiles(id) on delete set null,
  status              work_order_status not null default 'received',
  description         text,
  diagnosis           text,
  estimated_cost      numeric(10, 2) check (estimated_cost >= 0),
  final_cost          numeric(10, 2) check (final_cost >= 0),
  received_at         timestamptz not null default now(),
  estimated_delivery  timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- TABLA: work_order_items
-- ============================================================

create table work_order_items (
  id             uuid primary key default uuid_generate_v4(),
  work_order_id  uuid not null references work_orders(id) on delete cascade,
  type           work_order_item_type not null,
  description    text not null,
  quantity       numeric(10, 3) not null default 1 check (quantity > 0),
  unit_price     numeric(10, 2) not null check (unit_price >= 0),
  total          numeric(10, 2) not null check (total >= 0),
  inventory_id   uuid references inventory(id) on delete set null
);

-- ============================================================
-- TABLA: inventory
-- ============================================================

create table inventory (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  sku               text unique,
  category          text,
  brand             text,
  compatible_brands text[],
  quantity          integer not null default 0 check (quantity >= 0),
  min_stock         integer not null default 0 check (min_stock >= 0),
  cost_price        numeric(10, 2) check (cost_price >= 0),
  sell_price        numeric(10, 2) check (sell_price >= 0),
  location          text,
  supplier          text,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- TABLA: appointments
-- ============================================================

create table appointments (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references profiles(id) on delete cascade,
  vehicle_id   uuid references vehicles(id) on delete set null,
  date         date not null,
  time_slot    time not null,
  service_type text not null,
  status       appointment_status not null default 'pending',
  notes        text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TABLA: vehicles_for_sale
-- ============================================================

create table vehicles_for_sale (
  id           uuid primary key default uuid_generate_v4(),
  brand        text not null,
  model        text not null,
  year         smallint not null check (year >= 1900 and year <= 2100),
  price        numeric(12, 2) not null check (price >= 0),
  mileage      integer check (mileage >= 0),
  color        text,
  transmission transmission_type,
  fuel_type    fuel_type_enum,
  description  text,
  features     text[],
  status       vehicle_sale_status not null default 'available',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TABLA: vehicle_photos
-- ============================================================

create table vehicle_photos (
  id              uuid primary key default uuid_generate_v4(),
  vehicle_sale_id uuid references vehicles_for_sale(id) on delete cascade,
  vehicle_id      uuid references vehicles(id) on delete cascade,
  url             text not null,
  "order"         smallint not null default 0,
  created_at      timestamptz not null default now(),
  -- foto debe pertenecer a exactamente uno de los dos tipos de vehiculo
  constraint vehicle_photos_one_owner check (
    (vehicle_sale_id is not null)::int + (vehicle_id is not null)::int = 1
  )
);

-- ============================================================
-- TABLA: quotes
-- ============================================================

create table quotes (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references profiles(id) on delete restrict,
  vehicle_id  uuid references vehicles(id) on delete set null,
  items       jsonb not null default '[]',
  total       numeric(10, 2) not null default 0 check (total >= 0),
  status      quote_status not null default 'draft',
  valid_until date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLA: invoices
-- ============================================================

create table invoices (
  id             uuid primary key default uuid_generate_v4(),
  work_order_id  uuid references work_orders(id) on delete restrict,
  quote_id       uuid references quotes(id) on delete restrict,
  client_id      uuid not null references profiles(id) on delete restrict,
  items          jsonb not null default '[]',
  subtotal       numeric(10, 2) not null check (subtotal >= 0),
  tax            numeric(10, 2) not null default 0 check (tax >= 0),
  total          numeric(10, 2) not null check (total >= 0),
  status         invoice_status not null default 'draft',
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABLA: shop_config
-- ============================================================

create table shop_config (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  logo_url        text,
  primary_color   text not null default '#e94560',
  secondary_color text not null default '#16213e',
  phone           text,
  address         text,
  schedule        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- Solo debe existir una fila de configuracion
create unique index shop_config_single_row on shop_config ((true));

-- ============================================================
-- INDICES
-- ============================================================

-- vehicles
create index idx_vehicles_owner_id on vehicles(owner_id);

-- work_orders
create index idx_work_orders_vehicle_id   on work_orders(vehicle_id);
create index idx_work_orders_client_id    on work_orders(client_id);
create index idx_work_orders_mechanic_id  on work_orders(mechanic_id);
create index idx_work_orders_status       on work_orders(status);

-- work_order_items
create index idx_work_order_items_order_id on work_order_items(work_order_id);

-- inventory
create index idx_inventory_sku      on inventory(sku);
create index idx_inventory_category on inventory(category);
-- alerta de stock bajo
create index idx_inventory_low_stock on inventory(quantity) where quantity <= min_stock;

-- appointments
create index idx_appointments_client_id  on appointments(client_id);
create index idx_appointments_vehicle_id on appointments(vehicle_id);
create index idx_appointments_date       on appointments(date);
create index idx_appointments_status     on appointments(status);

-- vehicles_for_sale
create index idx_vehicles_for_sale_status on vehicles_for_sale(status);

-- vehicle_photos
create index idx_vehicle_photos_sale_id on vehicle_photos(vehicle_sale_id);
create index idx_vehicle_photos_veh_id  on vehicle_photos(vehicle_id);

-- quotes
create index idx_quotes_client_id on quotes(client_id);
create index idx_quotes_status    on quotes(status);

-- invoices
create index idx_invoices_client_id     on invoices(client_id);
create index idx_invoices_work_order_id on invoices(work_order_id);
create index idx_invoices_status        on invoices(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles          enable row level security;
alter table vehicles          enable row level security;
alter table work_orders       enable row level security;
alter table work_order_items  enable row level security;
alter table inventory         enable row level security;
alter table appointments      enable row level security;
alter table vehicles_for_sale enable row level security;
alter table vehicle_photos    enable row level security;
alter table quotes            enable row level security;
alter table invoices          enable row level security;
alter table shop_config       enable row level security;

-- Helper: rol del usuario autenticado
create or replace function auth_role()
returns user_role
language sql stable
security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

-- Cada usuario ve y edita su propio perfil
create policy "profiles: own read"
  on profiles for select
  using (id = auth.uid() or auth_role() = 'admin');

create policy "profiles: own update"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins pueden ver y modificar todos los perfiles
create policy "profiles: admin all"
  on profiles for all
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- vehicles
-- ------------------------------------------------------------

create policy "vehicles: owner read"
  on vehicles for select
  using (owner_id = auth.uid() or auth_role() in ('mechanic', 'admin'));

create policy "vehicles: owner insert"
  on vehicles for insert
  with check (owner_id = auth.uid() or auth_role() = 'admin');

create policy "vehicles: owner update"
  on vehicles for update
  using (owner_id = auth.uid() or auth_role() = 'admin');

create policy "vehicles: owner delete"
  on vehicles for delete
  using (owner_id = auth.uid() or auth_role() = 'admin');

-- ------------------------------------------------------------
-- work_orders
-- ------------------------------------------------------------

create policy "work_orders: client read own"
  on work_orders for select
  using (
    client_id = auth.uid()
    or mechanic_id = auth.uid()
    or auth_role() = 'admin'
  );

create policy "work_orders: mechanic/admin write"
  on work_orders for insert
  with check (auth_role() in ('mechanic', 'admin'));

create policy "work_orders: mechanic/admin update"
  on work_orders for update
  using (auth_role() in ('mechanic', 'admin'));

create policy "work_orders: admin delete"
  on work_orders for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- work_order_items
-- ------------------------------------------------------------

create policy "work_order_items: read via order"
  on work_order_items for select
  using (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id
        and (wo.client_id = auth.uid() or wo.mechanic_id = auth.uid() or auth_role() = 'admin')
    )
  );

create policy "work_order_items: mechanic/admin write"
  on work_order_items for insert
  with check (auth_role() in ('mechanic', 'admin'));

create policy "work_order_items: mechanic/admin update"
  on work_order_items for update
  using (auth_role() in ('mechanic', 'admin'));

create policy "work_order_items: admin delete"
  on work_order_items for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- inventory (solo staff)
-- ------------------------------------------------------------

create policy "inventory: staff read"
  on inventory for select
  using (auth_role() in ('mechanic', 'admin'));

create policy "inventory: admin write"
  on inventory for insert
  with check (auth_role() = 'admin');

create policy "inventory: admin update"
  on inventory for update
  using (auth_role() = 'admin');

create policy "inventory: admin delete"
  on inventory for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- appointments
-- ------------------------------------------------------------

create policy "appointments: client read own"
  on appointments for select
  using (client_id = auth.uid() or auth_role() in ('mechanic', 'admin'));

create policy "appointments: client insert"
  on appointments for insert
  with check (client_id = auth.uid() or auth_role() = 'admin');

create policy "appointments: client/admin update"
  on appointments for update
  using (client_id = auth.uid() or auth_role() = 'admin');

create policy "appointments: admin delete"
  on appointments for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- vehicles_for_sale (publico para lectura)
-- ------------------------------------------------------------

create policy "vehicles_for_sale: public read"
  on vehicles_for_sale for select
  using (true);

create policy "vehicles_for_sale: admin write"
  on vehicles_for_sale for insert
  with check (auth_role() = 'admin');

create policy "vehicles_for_sale: admin update"
  on vehicles_for_sale for update
  using (auth_role() = 'admin');

create policy "vehicles_for_sale: admin delete"
  on vehicles_for_sale for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- vehicle_photos (publico para lectura)
-- ------------------------------------------------------------

create policy "vehicle_photos: public read"
  on vehicle_photos for select
  using (true);

create policy "vehicle_photos: admin write"
  on vehicle_photos for insert
  with check (auth_role() = 'admin');

create policy "vehicle_photos: admin update"
  on vehicle_photos for update
  using (auth_role() = 'admin');

create policy "vehicle_photos: admin delete"
  on vehicle_photos for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- quotes
-- ------------------------------------------------------------

create policy "quotes: client read own"
  on quotes for select
  using (client_id = auth.uid() or auth_role() = 'admin');

create policy "quotes: admin write"
  on quotes for insert
  with check (auth_role() = 'admin');

create policy "quotes: admin update"
  on quotes for update
  using (auth_role() = 'admin');

create policy "quotes: admin delete"
  on quotes for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------

create policy "invoices: client read own"
  on invoices for select
  using (client_id = auth.uid() or auth_role() = 'admin');

create policy "invoices: admin write"
  on invoices for insert
  with check (auth_role() = 'admin');

create policy "invoices: admin update"
  on invoices for update
  using (auth_role() = 'admin');

create policy "invoices: admin delete"
  on invoices for delete
  using (auth_role() = 'admin');

-- ------------------------------------------------------------
-- shop_config (publico para lectura, solo admin escribe)
-- ------------------------------------------------------------

create policy "shop_config: public read"
  on shop_config for select
  using (true);

create policy "shop_config: admin write"
  on shop_config for insert
  with check (auth_role() = 'admin');

create policy "shop_config: admin update"
  on shop_config for update
  using (auth_role() = 'admin');
