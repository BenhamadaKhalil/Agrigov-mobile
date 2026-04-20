// ─── Re-export base API type ──────────────────────────────────────────────────

export type { Product as ApiProduct } from "./Product";

// ─── UI-only types ────────────────────────────────────────────────────────────

export type SpecTab = "Specifications" | "Harvest Details" | "Quality Certificates";

export interface ProductSpec {
  label: string;
  value: string;
  verified?: boolean;
}

export interface ChartBar {
  label:       string;
  heightPct:   number; // 0–100
  highlighted?: boolean;
  tooltip?:    string;
}

export interface LogisticsDetail {
  icon:        string;
  iconBg:      string;
  iconColor:   string;
  title:       string;
  description: string;
}

// ─── Static logistics config (these don't come from the API) ─────────────────

export const DEFAULT_LOGISTICS: LogisticsDetail[] = [
  {
    icon:        "inventory_2",
    iconBg:      "bg-blue-50",
    iconColor:   "text-blue-600",
    title:       "Packaging",
    description: "Packaged in standard bags or containers per Ministry regulations.",
  },
  {
    icon:        "local_shipping",
    iconBg:      "bg-orange-50",
    iconColor:   "text-orange-600",
    title:       "Transport Options",
    description: "Available for pickup or third-party logistics via Ministry platform.",
  },
  {
    icon:        "schedule",
    iconBg:      "bg-green-50",
    iconColor:   "text-green-600",
    title:       "Lead Time",
    description: "Ready for dispatch within 24–48 hours of payment confirmation.",
  },
];