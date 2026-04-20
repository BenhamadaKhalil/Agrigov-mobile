import { apiFetch } from "./api";

export const profileApi = {
  me: () => apiFetch("/api/users/me/"),

  update: (data: any) =>
    apiFetch("/api/users/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  myOrders: () =>
    apiFetch("/api/orders/"),

  myReviews: () =>
    apiFetch("/api/reviews/my-reviews/"),

  myMissions: () =>
    apiFetch("/api/missions/my-missions/"),
};