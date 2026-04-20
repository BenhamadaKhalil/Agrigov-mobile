import { apiFetch } from "./api";

export const productApi = {
  list: (qs: string) =>
    apiFetch(`/api/products/?${qs}`),

  detail: (id: number | string) =>
    apiFetch(`/api/products/${id}/`),

  search: (q: string) =>
    apiFetch(`/api/products/?search=${q}`),

  ministryProducts: () =>
    apiFetch("/api/products/ministry/"),
};