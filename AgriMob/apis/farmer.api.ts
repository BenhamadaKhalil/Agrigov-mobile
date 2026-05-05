import { apiFetch } from "./api";

export interface FarmerMission {
  id: number;
  order: number;
  order_status: string;
  order_total_price: number | null;
  order_items_summary: {
    items_count: number;
    total_quantity: number;
    description: string;
  } | null;
  transporter: number | null;
  transporter_email: string | null;
  vehicle: number | null;
  vehicle_info: string | null;
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  wilaya: string;
  baladiya: string;
  pickup_address: string;
  delivery_address: string;
  notes: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  decline_count: number;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const farmerApi = {
  myProducts: (qs: string) =>
    apiFetch(`/api/products/my/?${qs}`),

  createProduct: (data: FormData) =>
    apiFetch("/api/products/create/", {
      method: "POST",
      body: data,
    }),

  updateProduct: (id: number, data: FormData) =>
    apiFetch(`/api/products/${id}/update/`, {
      method: "PATCH",
      body: data,
    }),

  deleteProduct: (id: number) =>
    apiFetch(`/api/products/${id}/`, { method: "DELETE" }),

  dashboard: () =>
    apiFetch("/api/dashboards/farmer/"),

  inventory: () =>
    apiFetch("/api/products/my/"),

  myFarms: () =>
    apiFetch("/api/farms/me/"),

  // ─── Missions ──────────────────────────────────────────────
  myMissions: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return apiFetch<FarmerMission[]>(`/api/missions/my-farm/${qs}`);
  },

  createMission: (data: { order: number; pickup_address?: string; delivery_address?: string; notes?: string }) =>
    apiFetch<FarmerMission>("/api/missions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancelMission: (id: number) =>
    apiFetch<FarmerMission>(`/api/missions/${id}/cancel/`, {
      method: "PATCH",
    }),

  missionDetail: (id: number) =>
    apiFetch<FarmerMission>(`/api/missions/${id}/`),
};