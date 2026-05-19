import { apiFetch } from "./api";

export const profileApi = {
  me: () => apiFetch("/api/users/me/"),

  update: (data: any) =>
    apiFetch("/api/users/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateImage: (role: string, imageUri: string, mimeType: string, fileName: string) => {
    const fd = new FormData();
    const fieldName = role === "TRANSPORTER" ? "profile_image" : "profile_image_upload";
    fd.append(fieldName, {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);

    let path = "";
    if (role === "FARMER") path = "/api/users/auth/farmer-profile/";
    if (role === "BUYER") path = "/api/users/auth/buyer-profile/";
    if (role === "TRANSPORTER") path = "/api/users/auth/transporter-profile/";

    return apiFetch(path, {
      method: role === "FARMER" ? "PUT" : "PATCH",
      body: fd,
    });
  },

  myOrders: () =>
    apiFetch("/api/orders/"),

  myReviews: () =>
    apiFetch("/api/reviews/my-reviews/"),

  myMissions: () =>
    apiFetch("/api/missions/my-missions/"),
};