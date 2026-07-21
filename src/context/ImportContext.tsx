import React, { createContext, useContext, useState } from 'react';
import type { ImportRecord } from '../types';

const genId = () => `ir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const SEED: ImportRecord[] = [
  {
    id: 'seed-1',
    storeId: 's-pz',
    period: '2026-02',
    reportType: 'pos_daily',
    fileName: '平鎮店_2026-02_POS日報.xlsx',
    uploadedAt: '2026-03-03T10:15:00.000Z',
    status: 'success',
  },
  {
    id: 'seed-2',
    storeId: 's-pz',
    period: '2026-02',
    reportType: 'product_txn',
    fileName: '平鎮店_2026-02_商品明細.xlsx',
    uploadedAt: '2026-03-03T10:18:00.000Z',
    status: 'success',
  },
  {
    id: 'seed-3',
    storeId: 's-ty',
    period: '2026-02',
    reportType: 'pos_daily',
    fileName: '桃園店_2602_日報.xlsx',
    uploadedAt: '2026-03-04T09:05:00.000Z',
    status: 'success',
  },
  {
    id: 'seed-4',
    storeId: 's-ty',
    period: '2026-02',
    reportType: 'crm_store',
    fileName: 'CRM_中壢店_2026-02.xlsx',
    uploadedAt: '2026-03-03T14:22:00.000Z',
    status: 'store_mismatch',
    failReason: '門市不符：檔案內容顯示為「中壢店」，與所選門市「桃園店」不符',
  },
  {
    id: 'seed-5',
    storeId: 's-zl',
    period: '2026-02',
    reportType: 'labor',
    fileName: '中壢店_工時表_2026-01.xlsx',
    uploadedAt: '2026-03-05T11:30:00.000Z',
    status: 'period_mismatch',
    failReason: '期間不符：檔案內容為 2026-01，與所選期間 2026-02 不符',
  },
  {
    id: 'seed-6',
    storeId: 's-pz',
    period: '2026-02',
    reportType: 'purchase',
    fileName: '採購入庫_2月.xlsx',
    uploadedAt: '2026-03-03T15:48:00.000Z',
    status: 'failed',
    failReason: '檔案無法開啟：請確認檔案未毀損，或重新匯出後再上傳',
  },
  {
    id: 'seed-7',
    storeId: 's-zb',
    period: '2026-02',
    reportType: 'target',
    fileName: '竹北店_2026-02_目標表.xlsx',
    uploadedAt: '2026-03-02T08:40:00.000Z',
    status: 'success',
  },
];

interface ImportContextValue {
  records: ImportRecord[];
  addRecord: (r: Omit<ImportRecord, 'id'>) => string;
  updateRecord: (id: string, patch: Partial<ImportRecord>) => void;
  removeRecord: (id: string) => void;
}

const ImportContext = createContext<ImportContextValue | null>(null);

export function ImportProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ImportRecord[]>(SEED);

  const addRecord = (r: Omit<ImportRecord, 'id'>): string => {
    const id = genId();
    setRecords(prev => [{ ...r, id }, ...prev]);
    return id;
  };

  const updateRecord = (id: string, patch: Partial<ImportRecord>) => {
    setRecords(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <ImportContext.Provider value={{ records, addRecord, updateRecord, removeRecord }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const ctx = useContext(ImportContext);
  if (!ctx) throw new Error('useImport must be used within ImportProvider');
  return ctx;
}
