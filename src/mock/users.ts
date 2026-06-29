import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u-admin',
    name: '系統管理員',
    role: 'admin',
  },
  {
    id: 'u-director',
    name: '林總監',
    role: 'director',
  },
  {
    id: 'u-sup',
    name: '周督導',
    role: 'supervisor',
    regionIds: ['r-ty'],
  },
  {
    id: 'u-mgr',
    name: '王小明',
    role: 'manager',
    storeIds: ['s-pz'],
  },
];
