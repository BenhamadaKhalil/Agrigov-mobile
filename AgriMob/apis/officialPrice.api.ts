import { apiFetch } from "./api";

export interface MinistryProduct {
  id: number;
  name: string;
  category: number;
  image?: string;
  description?: string;
}

export interface OfficialPrice {
  effective_date: any;
  id: number;
  product: number;
  product_detail: MinistryProduct;
  wilaya: string | null;
  region_name: string | null;
  min_price: string;
  max_price: string;
  unit: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export const officialPriceApi = {
  activePrices: () => apiFetch<OfficialPrice[]>("/api/official-prices/active/"),
  currentPrice: (productId: number, wilaya?: string) => {
    let url = `/api/official-prices/current/?product_id=${productId}`;
    if (wilaya) url += `&wilaya=${wilaya}`;
    return apiFetch<OfficialPrice>(url);
  },
};
