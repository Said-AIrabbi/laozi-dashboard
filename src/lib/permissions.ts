import type { User, Store } from '../types';

/** Returns stores visible to the given user */
export function getVisibleStores(user: User, allStores: Store[]): Store[] {
  if (user.role === 'admin' || user.role === 'director') return allStores;
  if (user.role === 'supervisor') {
    const regions = user.regionIds ?? [];
    return allStores.filter((s) => regions.includes(s.regionId));
  }
  // manager
  return allStores.filter((s) => (user.storeIds ?? []).includes(s.id));
}

/** Returns region IDs locked for this user (empty = not locked) */
export function getLockedRegionIds(user: User): string[] {
  if (user.role === 'supervisor') return user.regionIds ?? [];
  return [];
}
