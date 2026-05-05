import { apiFetch } from "./api";

export interface ProductDetail {
  id: number;
  farmer_name: string;
  category_name: string;
  description: string;
  unit_price: string;
  ministry_product: {
    id: number;
    name: string;
    category_name: string;
  };
  images: { id: number; image: string }[];
}

export interface Review {
  id: number;
  product: ProductDetail;
  buyer: number;
  rating: number;        // 1–5
  comment: string;
  created_at: string;
}

export interface ReviewsResponse {
  count?: number;
  results?: Review[];
}

export const reviewApi = {
  /** GET /api/reviews/reviews/?product=<id>  — all reviews for a product */
  forProduct: (productId: number | string) =>
    apiFetch<ReviewsResponse | Review[]>(
      `/api/reviews/reviews/?product=${productId}`
    ),

  /** POST /api/reviews/reviews/  — create a review (must have a delivered order) */
  create: (payload: { product_id: number; rating: number; comment: string }) =>
    apiFetch<Review>("/api/reviews/reviews/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /api/reviews/my-reviews/  — buyer's own reviews */
  myReviews: () =>
    apiFetch<ReviewsResponse | Review[]>("/api/reviews/my-reviews/"),

  /** DELETE /api/reviews/reviews/<id>/  — delete own review */
  delete: (id: number) =>
    apiFetch(`/api/reviews/reviews/${id}/`, { method: "DELETE" }),
};
