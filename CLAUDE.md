# TallerPro - Sistema de Gestion para Talleres Mecanicos

## Vision
Sistema white-label para talleres mecanicos automotrices. Dos interfaces: storefront para clientes y dashboard para el taller. Listo para personalizar por cliente.

## Stack
- Next.js (latest) + React 19 + TypeScript 5 + Tailwind CSS 4
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- Zustand para estado global
- Framer Motion para animaciones
- Deploy en Vercel

## Arquitectura

### Storefront (cliente final) - rutas /
- Landing page del taller con servicios
- Catalogo de repuestos con busqueda por marca/modelo/ano
- Vehiculos en venta con galeria de fotos
- Agendar cita para servicio/reparacion
- Consultar estado de mi vehiculo en el taller (tracking)
- Historial de servicios de mi vehiculo
- Solicitar cotizacion online
- Login/registro de clientes

### Dashboard (taller) - rutas /dashboard
- Panel principal con metricas del dia
- Ordenes de trabajo (recepcion -> diagnostico -> reparacion -> entrega)
- Inventario de repuestos (stock, precios, proveedores, alertas de stock bajo)
- Gestion de vehiculos en venta (CRUD, fotos, estado)
- Clientes y sus vehiculos (historial completo)
- Agenda/calendario de citas
- Cotizaciones y facturacion
- Reportes (ventas, servicios mas comunes, inventario)
- Configuracion del taller (nombre, logo, colores, horarios)

## DB Schema (Supabase)

### Tablas principales
- profiles: id, email, full_name, phone, role (client/mechanic/admin), avatar_url, created_at
- vehicles: id, owner_id (FK profiles), brand, model, year, plate, color, vin, mileage, notes, created_at
- work_orders: id, vehicle_id (FK), client_id (FK), mechanic_id (FK), status (received/diagnosing/repairing/ready/delivered), description, diagnosis, estimated_cost, final_cost, received_at, estimated_delivery, delivered_at, created_at
- work_order_items: id, work_order_id (FK), type (labor/part), description, quantity, unit_price, total
- inventory: id, name, sku, category, brand, compatible_brands, quantity, min_stock, cost_price, sell_price, location, supplier, created_at
- appointments: id, client_id (FK), vehicle_id (FK), date, time_slot, service_type, status (pending/confirmed/completed/cancelled), notes, created_at
- vehicles_for_sale: id, brand, model, year, price, mileage, color, transmission, fuel_type, description, features, status (available/reserved/sold), created_at
- vehicle_photos: id, vehicle_sale_id (FK) OR vehicle_id (FK), url, order, created_at
- quotes: id, client_id (FK), vehicle_id (FK), items JSONB, total, status (draft/sent/accepted/rejected), valid_until, created_at
- invoices: id, work_order_id (FK), quote_id (FK), client_id (FK), items JSONB, subtotal, tax, total, status (draft/sent/paid), paid_at, created_at
- shop_config: id, name, logo_url, primary_color, secondary_color, phone, address, schedule JSONB, created_at

### RLS Policies
- Clientes solo ven sus propios vehiculos, ordenes, citas
- Mecanicos ven ordenes asignadas a ellos
- Admins ven todo
- Storefront publico: vehiculos en venta, catalogo de repuestos

## Visual Theme
- Estilo industrial/automotriz moderno
- Colores base: gris oscuro (#1a1a2e), azul acero (#16213e), acento naranja (#e94560) o rojo
- Tipografia limpia y legible
- Iconos de herramientas/autos donde aplique
- Cards con sombras sutiles, bordes redondeados
- Responsive: mobile-first para clientes, desktop-first para dashboard

## CRITICAL RULES
1. ALWAYS run npm run build after changes to verify they compile
2. NEVER move files without updating ALL imports that reference them
3. NEVER commit if the build fails
4. Keep changes small and focused - one feature per task
5. Test responsive: storefront must work perfectly on mobile
6. Use existing Tailwind classes and design tokens
7. All UI text in Spanish
8. Use Supabase Auth for authentication
9. Use Supabase Storage for photos/files
10. Use Supabase Realtime for live order status updates
11. Follow the DB schema above - do not invent new tables without reason
12. Use Zustand for client-side state management
13. Use Server Components where possible, Client Components only when needed
