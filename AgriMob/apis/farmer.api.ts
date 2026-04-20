import { apiFetch } from "./api";

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
};