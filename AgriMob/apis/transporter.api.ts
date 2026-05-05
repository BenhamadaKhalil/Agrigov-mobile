import { apiFetch } from "./api";

export interface ApiVehicle {
  id: number;
  transporter: number;
  type: string;
  model: string;
  year: number;
  capacity: number;
}

export interface ApiTransporter {
  id: number;
  name: string;
  email: string;
  phone: string;
  wilaya: string;
  rating: number;
  completed_missions: number;
  is_verified: boolean;
  vehicles?: ApiVehicle[];
}

export interface TransporterWithPricing extends ApiTransporter {
  price_per_km: number;
  base_price: number;
  estimated_delivery_days: number;
}

export interface ApiMission {
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

export interface MissionsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiMission[];
}

export interface VehiclesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiVehicle[];
}

export const transporterApi = {
  // ─── Transporters ────────────────────────────────────────────────────────────────

  // GET /api/transporters/available/ - Get available transporters for buyer
  availableTransporters: (wilaya?: string) => {
    const qs = wilaya ? `?wilaya=${encodeURIComponent(wilaya)}` : "";
    return apiFetch<TransporterWithPricing[]>(`/api/transporters/available/${qs}`);
  },

  // ─── Missions ────────────────────────────────────────────────────────────────

  // GET /api/missions/available/ - Transporter sees pending missions in their wilaya
  availableMissions: (params?: { wilaya?: string; baladiya?: string; search?: string }) => {
    const qs = params
      ? Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
          .join("&")
      : "";
    return apiFetch<MissionsListResponse>(`/api/missions/available/${qs ? `?${qs}` : ""}`);
  },

  // GET /api/missions/my/ - Transporter's own missions
  myMissions: (params?: { status?: string; search?: string; ordering?: string }) => {
    const qs = params
      ? Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
          .join("&")
      : "";
    return apiFetch<MissionsListResponse>(`/api/missions/my/${qs ? `?${qs}` : ""}`);
  },

  // POST /api/missions/<id>/accept/ - Accept a mission (optionally with vehicle)
  acceptMission: (id: number, vehicleId?: number) =>
    apiFetch<ApiMission>(`/api/missions/${id}/accept/`, {
      method: "POST",
      body: JSON.stringify({ vehicle_id: vehicleId }),
    }),

  // POST /api/missions/<id>/decline/ - Decline a mission
  declineMission: (id: number) =>
    apiFetch<{ detail: string }>(`/api/missions/${id}/decline/`, {
      method: "POST",
    }),

  // PATCH /api/missions/<id>/status/ - Update mission status
  updateStatus: (
    id: number,
    status: "picked_up" | "in_transit" | "delivered"
  ) =>
    apiFetch<ApiMission>(`/api/missions/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // GET /api/missions/<id>/ - Mission detail
  detail: (id: number) =>
    apiFetch<ApiMission>(`/api/missions/${id}/`),

  // ─── Vehicles ────────────────────────────────────────────────────────────────

  // GET /api/vehicules/me/ - My vehicles
  myVehicles: () =>
    apiFetch<VehiclesListResponse>("/api/vehicules/me/"),

  // POST /api/vehicules/ - Create a new vehicle
  createVehicle: (data: { type: string; model: string; year: number; capacity: number }) =>
    apiFetch<ApiVehicle>("/api/vehicules/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};