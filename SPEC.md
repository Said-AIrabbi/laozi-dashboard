# 荖子鍋營運 BI Dashboard — 規格書

> 版本：v1.1　最後更新：2026-06-29

---

## 目錄

1. [專案概述](#1-專案概述)
2. [技術堆疊](#2-技術堆疊)
3. [目錄結構](#3-目錄結構)
4. [角色與權限系統](#4-角色與權限系統)
5. [資料模型](#5-資料模型)
6. [頁面規格](#6-頁面規格)
7. [共用元件](#7-共用元件)
8. [Context 狀態管理](#8-context-狀態管理)
9. [服務層](#9-服務層)
10. [匯出功能](#10-匯出功能)
11. [設計系統](#11-設計系統)
12. [路由規則](#12-路由規則)

---

## 1. 專案概述

**系統名稱：** 荖子鍋 · 營運 BI Dashboard  
**目的：** 提供荖子鍋連鎖火鍋餐廳各層級管理者即時查閱分店營業數據、控管成本指標、以及月結報告的內部管理工具。  
**使用對象：** 系統管理員（admin）、總監（director）、分區督導（supervisor）、門市店長（manager）  
**目前門市：** 6 間（桃園區 4 間、新竹區 2 間）  
**Demo 期間：** 2026 年 2 月（最新）、2026 年 1 月、2025 年 12 月

---

## 2. 技術堆疊

| 類別 | 套件 | 版本 |
|---|---|---|
| 框架 | React | 18.3 |
| 語言 | TypeScript | 5.6（strict 模式） |
| 建置工具 | Vite | 6.0 |
| UI 元件庫 | Ant Design | 5.22 |
| 圖表 | ECharts + echarts-for-react | 5.5 / 3.0 |
| 路由 | React Router DOM | 6.27 |
| Excel 匯出 | ExcelJS | 4.4 |
| 備援試算表 | xlsx (SheetJS) | 0.18 |

---

## 3. 目錄結構

```
src/
├── App.tsx                    # 路由根元件、Provider 包覆
├── main.tsx                   # 進入點
├── index.css                  # 全域樣式
│
├── types/
│   └── index.ts               # 所有 TypeScript 型別定義
│
├── context/
│   ├── RoleContext.tsx         # 登入狀態、使用者清單
│   └── SettingsContext.tsx     # 可調整門檻值（食材/人事占比）
│
├── lib/
│   ├── colors.ts              # 語意色彩常數與工具函式
│   ├── format.ts              # 數字格式化工具
│   ├── permissions.ts         # 角色過濾邏輯
│   └── exportExcel.ts         # Excel 匯出實作（ExcelJS）
│
├── services/
│   └── dashboardService.ts    # 資料存取層（封裝 mock）
│
├── mock/
│   ├── regions.ts             # 分區資料
│   ├── stores.ts              # 門市資料
│   ├── users.ts               # 使用者帳號
│   ├── monthly.ts             # 各店各月摘要數據
│   └── storeDetails.ts        # 各店月報完整資料
│
├── pages/
│   ├── Login.tsx              # 登入頁
│   ├── Overview.tsx           # 全店總覽
│   ├── StoreDetail.tsx        # 分店月報
│   └── AdminUsers.tsx         # 使用者管理（管理者限定）
│
└── components/
    ├── AppHeader.tsx
    ├── RoleSwitcher.tsx
    ├── KpiCard.tsx
    ├── ChartLegend.tsx
    ├── RevenueBarChart.tsx
    ├── GuestsBarChart.tsx
    ├── RatioBarChart.tsx
    ├── DetailBarChart.tsx
    ├── DualAxisChart.tsx
    ├── TrendChart.tsx
    ├── FoodCategoryChart.tsx
    ├── MallPieChart.tsx
    ├── MallTrendChart.tsx
    └── OverviewMetricsTable.tsx
```

---

## 4. 角色與權限系統

### 4.1 角色定義

| 角色 | 代碼 | 說明 |
|---|---|---|
| 系統管理 | `admin` | 總部，可看所有分店、管理帳號（含後台）、調整系統設定 |
| 總監 | `director` | 全區檢視，資料權限等同 admin，但**不可進入後台（/admin/users）** |
| 分區督導 | `supervisor` | 鎖定於指定分區（`regionIds[]`），只能看該區門市 |
| 店長 | `manager` | 鎖定於指定門市（`storeIds[]`），支援管理多店 |

角色層級：`admin` → `director` → `supervisor` → `manager`

### 4.2 資料可視範圍

```
admin       → 所有分店（不限區域）
director    → 所有分店（不限區域，同 admin）
supervisor  → storeIds ⊆ regionIds 對應的分店
manager     → storeIds[] 指定的分店
```

### 4.3 頁面存取矩陣

| 頁面 | admin | director | supervisor | manager |
|---|:---:|:---:|:---:|:---:|
| 登入 | ✅ | ✅ | ✅ | ✅ |
| 全店總覽 `/` | ✅ | ✅ | ✅ | ✅（多店時） |
| 分店月報 `/store/:id` | ✅ | ✅ | ✅（區內） | ✅（自己的店） |
| 使用者管理 `/admin/users` | ✅ | ❌ | ❌ | ❌ |

### 4.4 登入後重導向規則

- **Manager（單店）：** 自動跳轉至 `/store/:storeId`，不顯示返回總覽按鈕
- **Manager（多店）：** 停在總覽，僅顯示自己負責的門市，顯示返回按鈕
- **Supervisor / Director / Admin：** 停在總覽

### 4.5 匯出權限

| 功能 | admin | director | supervisor | manager |
|---|:---:|:---:|:---:|:---:|
| 全店匯出（總覽頁） | ✅ | ✅ | ✅（區內） | ❌ |
| 單店匯出（月報頁） | ✅ | ✅ | ✅（區內） | ✅（自己的店） |

### 4.6 Demo 帳號

| 帳號 | 密碼 | 角色 | 對應分店／分區 |
|---|---|---|---|
| `admin` | `admin123` | 系統管理 | — |
| `director` | `dir123` | 總監 | 全區檢視 |
| `supervisor` | `sup123` | 分區督導 | 桃園區 |
| `manager` | `mgr123` | 店長 | 平鎮店 |

---

## 5. 資料模型

### 5.1 Region

```typescript
interface Region {
  id: string;      // 'r-ty', 'r-hc'
  name: string;    // '桃園區', '新竹區'
}
```

### 5.2 Store

```typescript
interface Store {
  id: string;          // 's-pz', 's-ty', ...
  name: string;        // '平鎮店'
  regionId: string;    // 關聯 Region.id
  managerName: string; // 門市店長姓名
  mallName?: string;   // 所屬商場名稱（無商場則省略）
}
```

**現有門市（6 間）：**

| id | 名稱 | 分區 | 店長 | 所屬商場 |
|---|---|---|---|---|
| s-ty | 桃園店 | 桃園區 | 林志明 | 台茂購物中心 |
| s-zl | 中壢店 | 桃園區 | 陳怡君 | 大江購物中心 |
| s-bd | 八德店 | 桃園區 | 吳家瑋 | 八德廣豐商場 |
| s-pz | 平鎮店 | 桃園區 | 王小明 | 遠東巨城 |
| s-zb | 竹北店 | 新竹區 | 黃建宏 | 環球購物中心 |
| s-hc | 新竹店 | 新竹區 | 張雅婷 | 新竹大遠百 |

### 5.3 User

```typescript
interface User {
  id: string;
  name: string;
  role: 'admin' | 'director' | 'supervisor' | 'manager';
  regionIds?: string[];  // supervisor 指定分區（可複選）
  storeIds?: string[];   // manager 指定門市（可複選）
}
```

### 5.4 StoreMonthly（月摘要）

```typescript
interface StoreMonthly {
  storeId: string;
  period: string;          // 'YYYY-MM'
  revenue: number;         // 實際營業額
  target: number;          // 目標營業額
  guests: number;          // 來客數
  avgSpend: number;        // 客單價
  foodCostPct: number;     // 食材占比 %
  laborCostPct: number;    // 人事占比 %
  memberSpendPct: number;  // 會員消費占比 %
}
```

### 5.5 StoreDetail（月報完整資料）

繼承 `StoreMonthly`，另含：

```typescript
interface StoreDetail extends StoreMonthly {
  trend: TrendPoint[];          // 近 6 個月趨勢
  analysis: MetricCompare[];    // 指標比較表
  member: MemberStats;          // 會員分析
  activities: ActivityCoupon[]; // 活動商品（最多 8 項）
  other: OtherItems;            // 其他數據
  foodCategories: FoodCategoryPct[];  // 食材品項占比
  qualitative: QualitativeReport;     // 店長填報
  mall: MallData;               // 商場競爭分析資料
}
```

#### MallData / MallCompetitor / MallTrendPoint

```typescript
interface MallCompetitor {
  name: string;      // 競爭品牌名稱
  revenue: number;   // 當月營收（店長手動輸入，單位：元）
}

interface MallTrendPoint {
  label: string;     // 月份標籤（'9月'…'2月'）
  sharePct: number;  // 本店商場占比 %（0 = 無資料）
}

interface MallData {
  competitors: MallCompetitor[];  // 同商場競爭者清單（無資料時為空陣列）
  trend: MallTrendPoint[];        // 近 6 個月本店商場占比趨勢
}
```

- 無商場資料的門市使用 `ZERO_MALL`（competitors 空陣列，trend 全為 0%），UI 顯示佔位提示
- 店長可在分店月報頁編輯 `competitors`，其他角色唯讀

#### MetricCompare

```typescript
interface MetricCompare {
  label: string;
  current: number | string;  // 本月
  prevMonth?: number | string;  // 上月
  lastYear?: number | string;   // 去年同期
  original?: number | string;   // 原始（不含活動）
}
```

現有指標：`營業額`、`食材占比`、`客單價`、`人事占比`、`午間鍋數`、`午間鍋佔比`

#### MemberStats

```typescript
interface MemberStats {
  total: number;       // 會員總人數
  newCount: number;    // 本月新增
  growthPct: number;   // 成長率 %
  spend: number;       // 會員消費金額
  spendPct: number;    // 會員消費占比 %
}
```

#### ActivityCoupon

```typescript
interface ActivityCoupon {
  name: string;    // 券別名稱（如「95折」、「線上票券」）
  qty: number;     // 使用張數
  amount: number;  // 折讓金額
}
```

最多支援 8 項，分兩列排列於月報表格。

#### OtherItems

```typescript
interface OtherItems {
  scrapPork: number;   // 碎肉豬（kg）
  scrapBeef: number;   // 碎肉牛（kg）
  staffMeals: number;  // 員工餐（份）
  staffMealBreakdown?: { plumPork: number; belly: number; beef: number };
  voidCount: number;   // 作廢張數
  voidAmount: number;  // 作廢金額
  wasteVeg: number;    // 損耗蔬菜（kg）
}
```

#### QualitativeReport

```typescript
interface QualitativeReport {
  auditScore: number;        // SGS稽核分數（0-100）
  improvementPlan: string;   // 改善方案
  staffing: string;          // 人員配置說明
  equipment: string;         // 設備回報
  performanceNote: string;   // 本月業績分析
}
```

---

## 6. 頁面規格

### 6.1 Login（登入頁）`/login`

**路徑：** `src/pages/Login.tsx`

**功能：**
- 帳號密碼表單驗證
- Demo 快速登入按鈕（列出所有 Mock 使用者）
- 角色標籤色彩顯示（管理者=深藍、督導=中藍、店長=綠）
- 登入後依角色重導向

**登入後重導向：**
```
manager + 單店 → /store/:storeId
其他 → /
```

---

### 6.2 Overview（全店總覽）`/`

**路徑：** `src/pages/Overview.tsx`

**篩選器（Filter Bar）：**
- 期間選擇（Select）：可選月份，預設 2026-02
- 分區篩選（Select）：督導鎖定自己的區，管理者可選「全部」

**上半部：4 個主要直條圖**

| 圖表 | 元件 | 說明 |
|---|---|---|
| 各店營業額 | `RevenueBarChart` | 顏色依達成率；含達成率標籤 |
| 各店來客數 | `GuestsBarChart` | 藍色直條 |
| 各店食材占比 | `RatioBarChart` | 顏色依門檻帶；含 min/max markLine |
| 各店人事占比 | `RatioBarChart` | 同上 |

- 所有直條圖按數值**由高到低**排序
- 點擊直條跳轉至對應分店月報
- 圖高 = `Math.max(240, 店數 × 28)` px

**下半部：補充指標（3 個 Card + Tabs）**

**Card 1** — 食材 · 人事 · 客單 · 午間

| Tab | 圖表類型 |
|---|---|
| 食材費用 | DetailBarChart（顏色依門檻帶） |
| 人事費用 | DetailBarChart（顏色依門檻帶） |
| 客單價（元） | DetailBarChart |
| 午間鍋數 & 鍋估比（%） | DualAxisChart（左軸鍋數/右軸%）|

**Card 2** — 會員

| Tab | 圖表類型 |
|---|---|
| 會員人數 | DetailBarChart |
| 本月新增會員 | DetailBarChart |
| 會員消費金額 & 估比（%） | DualAxisChart |

**Card 3** — 發票

| Tab | 圖表類型 |
|---|---|
| （發票）作廢金額 | DetailBarChart |
| （發票）作廢張數 | DetailBarChart |

**商場競爭分析 Section（Card 4，位於會員 Card 與發票 Card 之間）**

- Card 標題右側有下拉選單，可選擇要檢視的門市
- 選擇不同門市時，兩個圖表以 `key` prop 強制重新掛載（觸發 ECharts 入場動畫）
- 兩欄並排：左欄 MallTrendChart、右欄 MallPieChart
- 呈現方式與 StoreDetail 商場競爭分析一致（非聚合，單店視角）

**全店數據明細表（最底部）**

- 23 欄位：門市、目標、營業額、達成率、去年同期、食材費/占比、人事費/占比、來客數、客單價、午間鍋數/估比、會員人數/新增/消費金額/估比、作廢張數/金額、損耗蔬菜
- 預設排序：筆畫少→多（`Intl.Collator('zh-u-co-stroke')`）
- **三段式排序：** 點一次=由高到低 ↓、點兩次=由低到高 ↑、點三次=回預設
- 色彩：食材/人事占比依門檻帶著色；達成率依達成情況著色
- 超標列整列標示背景色
- 匯出按鈕：僅 admin / supervisor 顯示（manager 隱藏）

---

### 6.3 StoreDetail（分店月報）`/store/:storeId`

**路徑：** `src/pages/StoreDetail.tsx`

**頁面頂部：**
- 麵包屑返回（admin/supervisor 永遠顯示；多店 manager 顯示；單店 manager 隱藏）
- 標題：`{店名} · 月會議報表`
- 副標：年月 · 店長姓名
- 右側：**匯出 Excel** 按鈕

**A 區：KPI 卡片（6 格）**

| 指標 | 格式 | 參照 |
|---|---|---|
| 營業額 | NT$ 萬 | 達成率子標題 |
| 達成率 | % | 顏色依達成情況 |
| 食材占比 | % | 顏色依門檻帶 |
| 人事占比 | % | 顏色依門檻帶 |
| 來客數 | 人 | vs 上月 delta |
| 客單價 | NT$ | vs 上月 delta |

**B 區：兩欄並排**

| 左欄 | 右欄 |
|---|---|
| 近 6 個月營業額趨勢（TrendChart，高 220px） | 食材類別占比圓餅圖（FoodCategoryChart，高 220px） |

食材占比：以**佔食材總成本的比例**顯示（= 品項佔營業額 ÷ 食材占比 × 100）

**C 區：兩欄並排**

| 左欄（lg:12） | 右欄（lg:12） |
|---|---|
| 營業分析比較表 | 其他數據分析（Tabs） |

**營業分析比較表**：比較 本月 / 上月 / 去年同期 / 原始（不含活動）

**其他數據分析（Tab 頁籤）：**

| Tab | 內容 |
|---|---|
| 會員分析 | 會員人數、新增、成長率、消費金額、消費占比 |
| 活動商品分析 | 券別 × 數量 × 金額（含合計列） |
| 其他項目 | 碎肉豬牛、員工餐（梅豬/五花/牛花細項）、作廢、損耗蔬菜 |

**H 區：商場競爭分析（`xs:24` 全寬，在質化報告之前）**

- 標題顯示商場名稱（若有）
- 兩欄並排：左欄折線圖、右欄圓餅圖

| 左欄（MallTrendChart） | 右欄（MallPieChart） |
|---|---|
| 本店近 6 個月商場占比趨勢折線圖 | 本月商場各品牌營收圓餅圖 |

- 圓餅圖：本店用品牌色，競爭者用灰色系；圓心顯示「本店占比 X.X%」
- 折線圖：Y 軸為 %；無資料時顯示灰色虛線（全為 0）
- **店長（manager）：** 可編輯競爭者名稱與營收（新增 / 刪除列）
- **其他角色：** 唯讀，競爭者列表不顯示操作欄
- 無商場競爭資料時（competitors 為空），圓餅圖顯示「尚無商場競爭資料」佔位

**D 區：店長填報（`xs:24` 全寬）**

- SGS 稽核分數（0–100）：店長可直接輸入，督導/管理者唯讀
- 四個文字欄位（textarea）：改善方案、人員配置、設備回報、本月業績分析
- 店長可編輯，其他角色唯讀
- 儲存按鈕（店長才顯示）

---

### 6.4 AdminUsers（使用者管理）`/admin/users`

**路徑：** `src/pages/AdminUsers.tsx`  
**存取限制：** 僅 `admin` 可進入（其他角色不顯示連結）

**使用者列表欄位：**

| 欄位 | 說明 |
|---|---|
| 姓名 | 顯示名稱 |
| 角色 | Tag 標籤（顏色對應角色） |
| 負責分區 | 督導顯示分區，其他留空 |
| 負責門市 | 店長顯示門市（多店用「、」分隔） |
| 操作 | 編輯 / 刪除（無法刪除自己） |

**新增 / 編輯 Modal 表單：**

- 姓名（必填）
- 角色（Select：管理者 / 分區督導 / 店長）
- 督導：勾選負責分區（Checkbox.Group，可複選）
- 店長：
  - **第一步**：勾選負責分區（Checkbox.Group）
  - **第二步**：由第一步過濾後的門市選擇（Select，mode="multiple"）
  - 切換分區時自動清空已選門市

**占比門檻設定（管理者限定，同頁面底部）：**

- 食材占比門檻：最低 `InputNumber` / 最高 `InputNumber`（步進 0.5%）
- 人事占比門檻：最低 / 最高
- 儲存後即時反映於全站所有圖表色彩與報表標題
- 預設值：食材 30%–33%，人事 14%–17%

---

## 7. 共用元件

### AppHeader

```
位置：所有認證頁面頂部
內容：
  左：🍲 荖子鍋 · 營運 BI Dashboard
  右：RoleSwitcher | 使用者管理（admin only）| 登出
樣式：背景 #1F4E5F，白字
```

### KpiCard

```
Props:
  title: string
  value: string
  subtitle?: string
  subtitleColor?: string
  delta?: number          // vs 上月差值
  positiveIsGood?: boolean // delta 的語意方向
```

### RevenueBarChart

```
Props: details, stores, onBarClick
功能:
  - 依達成率著色（綠/橘/紅）
  - 顯示達成率 % 於條頂
  - 按營業額降冪排序
  - 動態高度
```

### RatioBarChart

```
Props: details, stores, getValue, band, title, onBarClick
功能:
  - 顯示 markLine（門檻最小/最大值）
  - 依門檻帶著色（綠=達標/橘=偏低/紅=超標）
  - 按值降冪排序
```

### DetailBarChart

```
Props:
  details, stores
  getValue(d): number
  formatLabel(v): string
  formatTooltip(v): string
  getColor(d): string
  yAxisFormatter(v): string
  onBarClick?(storeId): void
功能: 通用直條圖，排序依 getValue 降冪
```

### DualAxisChart

```
Props:
  details, stores
  getBar(d): number      // 左軸直條值
  barLabel: string
  formatBar(v): string
  barColor: string
  getLine(d): number     // 右軸折線值
  lineLabel: string
  formatLine(v): string
  lineColor: string
  rightAxisUnit: string
  onBarClick?(storeId): void
功能: 左 Y 軸直條 + 右 Y 軸折線；按直條值降冪排序
```

### FoodCategoryChart

```
Props: data: FoodCategoryPct[], foodCostPct: number
功能:
  - 環形圓餅圖（radius: 38%–70%）
  - 數值換算：品項值 / 食材占比 × 100 → 佔食材比例
  - 圖例靠右
  - Tooltip 顯示「佔食材 X%」
高度: 220px
```

### TrendChart

```
Props: data: TrendPoint[]
功能:
  - 直條圖顯示近 6 個月營業額
  - 本月（最後一筆）= 深藍色 #1F4E5F，標籤加粗
  - 其他月份 = 淺綠色 #9FE1CB
  - Y 軸以萬為單位
高度: 220px
```

### OverviewMetricsTable

```
功能:
  - 固定表頭，可橫向捲動
  - 21 個可排序欄位
  - 排序循環：預設（筆畫）→ 降冪 ↓ → 升冪 ↑ → 預設
  - 食材/人事占比欄依門檻著色
  - 超標列整列背景標示
  - 店名可點擊跳轉
  - 預設按中文筆畫（Intl.Collator zh-u-co-stroke）排序
```

### MallPieChart

```
Props:
  ownLabel: string         // 本店名稱（如「平鎮店」）
  ownRevenue: number       // 本店月營收
  competitors: MallCompetitor[]
  mallName?: string        // 商場名稱（無資料時顯示）

功能:
  - 環形圓餅圖（radius: 36%–60%）
  - 本店用品牌色 primaryMid，競爭者用灰色系 palette
  - 圓心文字：「本店占比」+ 百分比
  - Tooltip：顯示各品牌名稱、營收（萬）、占比 %
  - 無資料時（competitors 空）顯示佔位提示「尚無商場競爭資料」
高度: max(260, 品牌數 × 40 + 80) px
```

### MallTrendChart

```
Props:
  series: Array<{ name: string; trend: MallTrendPoint[]; color?: string }>

功能:
  - 平滑折線圖，Y 軸為 %
  - 最後一個月數值顯示於線末 label
  - 全為 0 的 series 顯示灰色虛線
  - series.length > 1 時顯示圖例（底部）
  - Tooltip：觸發 axis，顯示各 series 佔比
高度: 260px
```

---

## 8. Context 狀態管理

### RoleContext

```typescript
// 提供：
currentUser: User | null
isLoggedIn: boolean
allUsers: User[]           // 含最新編輯狀態
login(user): void
logout(): void
updateUser(user): void     // 更新使用者並同步當前登入者
```

### SettingsContext

```typescript
// 提供：
thresholds: {
  food:  { min: number; max: number }   // 預設 30–33
  labor: { min: number; max: number }   // 預設 14–17
}
setThresholds(t: Thresholds): void
```

門檻值影響範圍：
- 全站所有 RatioBarChart 的 markLine 位置
- DetailBarChart 食材/人事費用的條色
- OverviewMetricsTable 的占比欄著色與超標列
- StoreDetail KPI 卡片顏色
- Overview 圖表卡片標題文字

---

## 9. 服務層

**`src/services/dashboardService.ts`**

| 方法 | 說明 |
|---|---|
| `getRegions()` | 取得所有分區 |
| `getAllStores()` | 取得所有門市 |
| `getVisibleStores(user)` | 依角色過濾可見門市 |
| `getMonthlyData(period, user)` | 取得可見門市的指定月份摘要 |
| `getStoreDetail(storeId)` | 取得單店完整月報 |
| `getStore(storeId)` | 取得單店基本資料 |
| `getPeriods()` | 取得可選月份清單 |
| `getVisibleDetails(user)` | 取得可見門市的所有月報 |

**`src/lib/permissions.ts`**

```typescript
getVisibleStores(user, allStores): Store[]
// admin, director → 全部
// supervisor → regionIds 篩選
// manager → storeIds 篩選

getLockedRegionIds(user): string[]
// supervisor → 回傳 regionIds（用於鎖定篩選器）
// 其他（含 director）→ []
```

---

## 10. 匯出功能

**`src/lib/exportExcel.ts`**（使用 ExcelJS）

### exportStoreDetailExcel(store, detail, period)

輸出：`荖子鍋_{門市}_{期間}_{日期}.xlsx`  
格式：**月報表格式**，單一工作表，各區塊色彩區分：

| 區塊 | 列 | 背景色 | 內容 |
|---|---|---|---|
| 標題列 | R1 | 白底深藍字 | `{期間}　{門市}店營運報告` |
| 營業分析 | R2–R6 | 綠色系 | 目標/實收/達成率/去年同期/午間鍋數；食材/來客/人事各欄 |
| 會員分析 | R7–R8 | 粉紅系 | 總人數/新增/成長率/消費估比/消費金額 |
| 活動商品 | R9–R10 | 黃色系 | 8 項券別（2 列 × 4 欄）數量/金額 |
| 其他項目 | R11 | 藍色系 | 碎肉/員工餐/作廢/損耗蔬菜 |

欄位寬度設定：A=7、B/D/F/H=20、C/E/G/I=13

### exportOverviewExcel(details, stores, period)

輸出：`荖子鍋_全店月報_{期間}_{日期}.xlsx`  
格式：**每間門市一個工作表**，格式同 exportStoreDetailExcel

---

## 11. 設計系統

### 品牌色票

| 名稱 | 色碼 | 用途 |
|---|---|---|
| primaryDark | `#1F4E5F` | Header 背景、主要強調、當月趨勢 |
| primaryMid | `#2E6E8E` | 次要強調 |
| green | `#1D9E75` | 達標、正向 |
| orange | `#EF9F27` | 接近門檻、警示 |
| red | `#E24B4A` | 超標、未達標、負向 |
| blue | `#378ADD` | 一般資料直條 |
| lightGreen | `#9FE1CB` | 趨勢圖歷史月份 |

### 語意色彩規則

**達成率（revenue / target）：**
- ≥ 100% → 綠
- ≥ 95% → 橘
- < 95% → 紅

**成本占比（相對門檻帶）：**
- 在區間內 [min, max] → 綠
- 低於 min → 橘（偏低，非必然不好）
- 高於 max → 紅（超標）

**Delta（vs 上月）：**
- `positiveIsGood=true`（如營業額）：正 → 綠，負 → 紅
- `positiveIsGood=false`（如成本）：正 → 紅，負 → 綠

### 可設定門檻

| 指標 | 預設下限 | 預設上限 | 設定入口 |
|---|---|---|---|
| 食材占比 | 30% | 33% | 使用者管理頁 |
| 人事占比 | 14% | 17% | 使用者管理頁 |

---

## 12. 路由規則

```
/login          → Login.tsx          （公開，未登入才可進入）
/               → Overview.tsx       （需登入）
/store/:storeId → StoreDetail.tsx    （需登入，角色過濾）
/admin/users    → AdminUsers.tsx     （需登入，建議加 admin 守衛）
*               → 重導向 /
```

**RequireAuth：** 未登入時重導向至 `/login`，附帶 `from` state 供登入後返回。

---

---

## 版本紀錄

| 版本 | 日期 | 變更摘要 |
|---|---|---|
| v1.0 | 2026-06-23 | 初版：基礎 BI Dashboard，3 角色（admin/supervisor/manager） |
| v1.1 | 2026-06-29 | 新增 director 角色；商場競爭分析功能（MallPieChart + MallTrendChart）；Overview 商場單店下拉選單；Store 新增 mallName；StoreDetail 新增 mall 資料；SGS稽核分數更名 |

*本規格書依程式碼狀態同步更新，如有後續功能迭代請同步維護。*
