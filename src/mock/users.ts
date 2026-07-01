import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u-admin',
    name: '系統管理員',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'u-director',
    name: '林總監',
    username: 'director',
    password: 'dir123',
    role: 'director',
  },
  {
    id: 'u-sup',
    name: '周督導',
    username: 'supervisor',
    password: 'sup123',
    role: 'supervisor',
    regionIds: ['r-ty'],
  },
  {
    id: 'u-mgr',
    name: '王小明',
    username: 'manager',
    password: 'mgr123',
    role: 'manager',
    storeIds: ['s-pz'],
  },
];
