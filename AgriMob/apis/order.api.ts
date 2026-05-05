import { apiFetch } from "./api";
import { BASE_URL } from "./config";
import { storage } from "./storage";

export interface CheckoutPayload {
  transporter_id: number;
  delivery_address: string;
  wilaya: string;
  baladiya: string;
  phone: string;
  payment_method?: string;
  card_number?: string;
  card_expiry?: string;
  card_cvc?: string;
  card_name?: string;
  notes?: string;
}

export interface CheckoutResponse {
  message: string;
}

/** Shape of an order returned by GET /api/orders/ */
export interface OrderResponse {
  id: number;
  buyer: string;
  farm: string;
  total_price: string;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  created_at: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      title: string;
      category_name: string;
    };
    quantity: number;
    total_price: number;
  }>;
  allowed_statuses: string[];
}

export const orderApi = {
  checkout: (payload: CheckoutPayload) =>
    apiFetch<CheckoutResponse>("/api/orders/checkout/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  detail: (id: number) =>
    apiFetch(`/api/orders/${id}/`),

  // Buyer's orders — the list endpoint is already role-scoped by get_queryset()
  myOrders: () =>
    apiFetch("/api/orders/"),

  // Farmer's orders (orders for farmer's products)
  farmerOrders: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return apiFetch(`/api/farmer/orders/${qs}`);
  },

  // Update order status — uses ViewSet update at PATCH /api/orders/{id}/
  updateStatus: (id: number, status: "confirmed" | "in_transit" | "delivered" | "cancelled") =>
    apiFetch(`/api/orders/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Invoice — returns the full URL and auth headers for file download
  getInvoiceDownloadInfo: async (orderId: number) => {
    const token = await storage.getToken();
    return {
      url: `${BASE_URL}/api/orders/${orderId}/invoice/`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },
};