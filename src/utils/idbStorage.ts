// IndexedDB Engine for Persistent Offline AMR Storage & Continuous Evaluation

export interface AMRBatchRecord {
  id: string;
  fileName: string;
  fileType: 'instant' | 'load_profile';
  uploadTimestamp: string;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  recordCount: number;
  criticalCount: number;
  warningCount: number;
  totalKva: number;
  unit: string;
  recordsSummary?: Array<{
    idpel: string;
    nama: string;
    tarif: string;
    daya: number;
    anomaliCount: number;
    hasCritical: boolean;
  }>;
}

export interface AMREvaluationSnapshot {
  id: string;
  timestamp: string;
  dateStr: string;
  title: string;
  totalCustomers: number;
  criticalCount: number;
  warningCount: number;
  avgCosphi: number;
  avgHealthScore: number;
  notes: string;
  evaluatedBy: string;
}

const DB_NAME = 'AMRPowerEye_OfflineDB_v1';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Batches store
      if (!db.objectStoreNames.contains('batches')) {
        const batchStore = db.createObjectStore('batches', { keyPath: 'id' });
        batchStore.createIndex('fileType', 'fileType', { unique: false });
        batchStore.createIndex('year', 'year', { unique: false });
        batchStore.createIndex('month', 'month', { unique: false });
        batchStore.createIndex('uploadTimestamp', 'uploadTimestamp', { unique: false });
      }

      // Evaluations store
      if (!db.objectStoreNames.contains('evaluations')) {
        const evalStore = db.createObjectStore('evaluations', { keyPath: 'id' });
        evalStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. SAVE BATCH
export async function saveBatchOffline(batch: AMRBatchRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('batches', 'readwrite');
      const store = tx.objectStore('batches');
      const req = store.put(batch);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveBatch error, using localStorage fallback', err);
    try {
      const raw = localStorage.getItem('amr_offline_batches') || '[]';
      const list = JSON.parse(raw);
      const filtered = list.filter((b: AMRBatchRecord) => b.id !== batch.id);
      localStorage.setItem('amr_offline_batches', JSON.stringify([batch, ...filtered]));
    } catch (e) {
      /* ignore */
    }
  }
}

// 2. GET ALL BATCHES
export async function getAllBatchesOffline(): Promise<AMRBatchRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('batches', 'readonly');
      const store = tx.objectStore('batches');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as AMRBatchRecord[]) || [];
        resolve(results.sort((a, b) => b.uploadTimestamp.localeCompare(a.uploadTimestamp)));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('amr_offline_batches') || '[]';
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

// 3. DELETE SINGLE BATCH
export async function deleteBatchOffline(batchId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('batches', 'readwrite');
      const store = tx.objectStore('batches');
      const req = store.delete(batchId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('amr_offline_batches') || '[]';
      const list = JSON.parse(raw);
      localStorage.setItem('amr_offline_batches', JSON.stringify(list.filter((b: any) => b.id !== batchId)));
    } catch (e) {
      /* ignore */
    }
  }
}

// 4. BULK DELETE BATCHES
export async function bulkDeleteBatchesOffline(batchIds: string[]): Promise<void> {
  const idSet = new Set(batchIds);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('batches', 'readwrite');
      const store = tx.objectStore('batches');
      batchIds.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('amr_offline_batches') || '[]';
      const list = JSON.parse(raw);
      localStorage.setItem('amr_offline_batches', JSON.stringify(list.filter((b: any) => !idSet.has(b.id))));
    } catch (e) {
      /* ignore */
    }
  }
}

// 5. EVALUATION LOGGING
export async function saveEvaluationSnapshotOffline(snapshot: AMREvaluationSnapshot): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evaluations', 'readwrite');
      const store = tx.objectStore('evaluations');
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('amr_offline_evaluations') || '[]';
      const list = JSON.parse(raw);
      localStorage.setItem('amr_offline_evaluations', JSON.stringify([snapshot, ...list]));
    } catch (e) {
      /* ignore */
    }
  }
}

export async function getAllEvaluationsOffline(): Promise<AMREvaluationSnapshot[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evaluations', 'readonly');
      const store = tx.objectStore('evaluations');
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as AMREvaluationSnapshot[]) || [];
        resolve(results.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem('amr_offline_evaluations') || '[]';
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

// Initial demo seeded batches so history is immediately rich
export const INITIAL_SEEDED_BATCHES: AMRBatchRecord[] = [
  {
    id: 'batch-20261013-instant',
    fileName: '52_INSTANT_20261013_9efcaeef.csv',
    fileType: 'instant',
    uploadTimestamp: '2026-10-13 08:30:00',
    month: 10,
    year: 2026,
    recordCount: 1500,
    criticalCount: 12,
    warningCount: 45,
    totalKva: 245000,
    unit: 'UP3 KUDUS',
  },
  {
    id: 'batch-20260920-loadprofile',
    fileName: '52_LOADPROFILE_SEPT_2026.xlsx',
    fileType: 'load_profile',
    uploadTimestamp: '2026-09-20 14:15:22',
    month: 9,
    year: 2026,
    recordCount: 2880,
    criticalCount: 4,
    warningCount: 28,
    totalKva: 182000,
    unit: 'UP3 KUDUS',
  },
  {
    id: 'batch-20260815-instant',
    fileName: '52_INSTANT_20260815_AGUSTUS.csv',
    fileType: 'instant',
    uploadTimestamp: '2026-08-15 10:05:18',
    month: 8,
    year: 2026,
    recordCount: 1420,
    criticalCount: 9,
    warningCount: 39,
    totalKva: 220000,
    unit: 'UP3 KUDUS',
  },
  {
    id: 'batch-20251210-instant',
    fileName: '52_INSTANT_20251210_DESEMBER.csv',
    fileType: 'instant',
    uploadTimestamp: '2025-12-10 09:20:00',
    month: 12,
    year: 2025,
    recordCount: 1380,
    criticalCount: 7,
    warningCount: 32,
    totalKva: 210000,
    unit: 'UP3 KUDUS',
  },
];
