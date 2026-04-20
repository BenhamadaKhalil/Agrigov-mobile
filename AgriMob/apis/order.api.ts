import { apiFetch } from "./api";

export const orderApi = {
  checkout: () =>
    apiFetch("/api/orders/checkout/", {
      method: "POST",
    }),

  detail: (id: number) =>
    apiFetch(`/api/orders/${id}/`),

  myOrders: () =>
    apiFetch("/api/orders/"),
};