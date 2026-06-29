import type { Region, Store, StoreMonthly, StoreDetail, User } from '../types';
import { mockRegions } from '../mock/regions';
import { mockStores } from '../mock/stores';
import { mockMonthly } from '../mock/monthly';
import { mockStoreDetails } from '../mock/storeDetails';
import { getVisibleStores } from '../lib/permissions';

export const dashboardService = {
  getRegions(): Region[] {
    return mockRegions;
  },

  getAllStores(): Store[] {
    return mockStores;
  },

  getVisibleStores(user: User): Store[] {
    return getVisibleStores(user, mockStores);
  },

  getMonthlyData(period: string, user: User): StoreMonthly[] {
    const visible = getVisibleStores(user, mockStores).map((s) => s.id);
    return mockMonthly.filter(
      (m) => m.period === period && visible.includes(m.storeId),
    );
  },

  getStoreDetail(storeId: string): StoreDetail | undefined {
    return mockStoreDetails[storeId];
  },

  getStore(storeId: string): Store | undefined {
    return mockStores.find((s) => s.id === storeId);
  },

  getPeriods(): string[] {
    return ['2026-02', '2026-01', '2025-12'];
  },

  /** Returns full StoreDetail for every store visible to the user */
  getVisibleDetails(user: User): StoreDetail[] {
    return getVisibleStores(user, mockStores)
      .map((s) => mockStoreDetails[s.id])
      .filter((d): d is StoreDetail => d !== undefined);
  },
};
