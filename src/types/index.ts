export type Role = 'admin' | 'director' | 'supervisor' | 'manager';

export interface MallCompetitor {
  name: string;
  revenue: number;
}

export interface MallTrendPoint {
  label: string;
  sharePct: number;
}

export interface MallData {
  competitors: MallCompetitor[];
  trend: MallTrendPoint[];
}

export interface Region {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
  regionId: string;
  managerName: string;
  mallName?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;   // unique login identifier
  password: string;   // plaintext (demo only, no real auth)
  role: Role;
  regionIds?: string[];  // supervisor only
  storeIds?: string[];   // manager only (can manage multiple stores)
}

export interface StoreMonthly {
  storeId: string;
  period: string;        // '2026-02'
  revenue: number;
  target: number;
  guests: number;
  avgSpend: number;
  foodCostPct: number;
  laborCostPct: number;
  memberSpendPct: number;
}

export interface MetricCompare {
  label: string;
  current: number | string;
  prevMonth?: number | string;
  lastYear?: number | string;
  original?: number | string;
}

export interface MemberStats {
  total: number;
  newCount: number;
  growthPct: number;
  spend: number;
  spendPct: number;
}

export interface ActivityCoupon {
  name: string;
  qty: number;
  amount: number;
}

export interface OtherItems {
  scrapPork: number;
  scrapBeef: number;
  staffMeals: number;
  staffMealBreakdown?: { plumPork: number; belly: number; beef: number };
  voidCount: number;
  voidAmount: number;
  wasteVeg: number;
}

export interface FoodCategoryPct {
  category: string;
  pct: number;
}

export interface TrendPoint {
  label: string;
  revenue: number;
}

export interface QualitativeReport {
  auditScore: number;
  improvementPlan: string;
  staffing: string;
  equipment: string;
  performanceNote: string;
}

export interface StoreDetail extends StoreMonthly {
  trend: TrendPoint[];
  analysis: MetricCompare[];
  member: MemberStats;
  activities: ActivityCoupon[];
  other: OtherItems;
  foodCategories: FoodCategoryPct[];
  qualitative: QualitativeReport;
  mall: MallData;
}

export const THRESHOLDS = {
  food: { min: 30, max: 33 },
  labor: { min: 14, max: 17 },
} as const;

export type ReportType =
  | 'pos_daily' | 'product_txn' | 'product_summary' | 'purchase'
  | 'crm_store' | 'crm_group' | 'customer_analysis'
  | 'labor' | 'other_items' | 'target';

export type ImportStatus =
  | 'success' | 'parsing' | 'store_mismatch'
  | 'period_mismatch' | 'duplicate' | 'failed';

export interface ImportRecord {
  id: string;
  storeId: string;
  period: string;       // 'YYYY-MM'
  reportType: ReportType;
  fileName: string;
  uploadedAt: string;   // ISO
  status: ImportStatus;
  failReason?: string;  // one-line reason shown when status isn't 'success'
}
