export type UserRole = "client" | "mechanic" | "admin";
export type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
export type WorkOrderItemType = "labor" | "part";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type VehicleSaleStatus = "available" | "reserved" | "sold";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  notes: string | null;
  created_at: string;
}

export interface Inventory {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  compatible_brands: string[] | null;
  quantity: number;
  min_stock: number;
  cost_price: number | null;
  sell_price: number;
  location: string | null;
  supplier: string | null;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  client_id: string;
  mechanic_id: string | null;
  status: WorkOrderStatus;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  inventory_id: string | null;
}

export interface Appointment {
  id: string;
  client_id: string;
  vehicle_id: string | null;
  date: string;
  time_slot: string;
  service_type: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

// Joined types used in UI
export interface WorkOrderWithRelations extends WorkOrder {
  client: Pick<Profile, "id" | "full_name" | "email" | "phone">;
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year" | "plate" | "color" | "vin" | "mileage">;
  mechanic: Pick<Profile, "id" | "full_name"> | null;
  items: WorkOrderItem[];
}

export interface WorkOrderListItem extends WorkOrder {
  client: Pick<Profile, "id" | "full_name">;
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year" | "plate">;
  mechanic: Pick<Profile, "id" | "full_name"> | null;
}
