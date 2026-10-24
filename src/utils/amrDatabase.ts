import { AMRRecord, PltsCustomerRecord } from '../types/amr';

const DB_NAME = 'PLN_AMR_POWEREYE_DB';
const DB_VERSION = 2;

export interface DatabaseStats {
  totalRecords: number;
  recordsByUnitInduk: Record<string, number>;
  totalCustomers: number;
  totalNonCustomers: number;
  totalPlts: number;
  anomalyRecordsCount: number;
  storageEstimateMb: number;
}

class AMRDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: records (partitioned by 2-digit unitIndukCode)
        if (!db.objectStoreNames.contains('records')) {
          const recordStore = db.createObjectStore('records', { keyPath: 'id' });
          recordStore.createIndex('unitIndukCode', 'unitIndukCode', { unique: false });
          recordStore.createIndex('locationCode', 'locationCode', { unique: false });
          recordStore.createIndex('isCustomer', 'isCustomer', { unique: false });
          recordStore.createIndex('readDate', 'readDate', { unique: false });
          recordStore.createIndex('unitAndCustomer', ['unitIndukCode', 'isCustomer'], { unique: false });
        }

        // Store 2: plts_customers (Solar net metering input database)
        if (!db.objectStoreNames.contains('plts_customers')) {
          const pltsStore = db.createObjectStore('plts_customers', { keyPath: 'idpel' });
          pltsStore.createIndex('unitUp3', 'unitUp3', { unique: false });
        }

        // Store 3: maintenance_routes
        if (!db.objectStoreNames.contains('maintenance_routes')) {
          db.createObjectStore('maintenance_routes', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save records in chunks of 500 to handle large datasets (up to 2GB files) without memory lockup.
   */
  async saveRecordsChunked(
    records: AMRRecord[],
    onProgress?: (savedCount: number, total: number) => void
  ): Promise<number> {
    const db = await this.getDB();
    const chunkSize = 500;
    let saved = 0;

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('records', 'readwrite');
        const store = tx.objectStore('records');

        chunk.forEach((rec) => {
          store.put(rec);
        });

        tx.oncomplete = () => {
          saved += chunk.length;
          if (onProgress) onProgress(saved, records.length);
          resolve();
        };

        tx.onerror = () => reject(tx.error);
      });
    }

    return saved;
  }

  /**
   * Get records filtered by 2-digit Unit Induk code ('all' or specific code like '52', '54', '53', '51').
   */
  async getRecordsByUnitInduk(unitIndukCode: string = 'all', limit: number = 20000): Promise<AMRRecord[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', 'readonly');
      const store = tx.objectStore('records');
      const results: AMRRecord[] = [];

      let request: IDBRequest;
      if (unitIndukCode === 'all') {
        request = store.openCursor();
      } else {
        const index = store.index('unitIndukCode');
        request = index.openCursor(IDBKeyRange.only(unitIndukCode));
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get all records from database.
   */
  async getAllRecords(limit: number = 25000): Promise<AMRRecord[]> {
    return this.getRecordsByUnitInduk('all', limit);
  }

  /**
   * Database statistics breakdown by 2-digit Unit Induk, customer type, and anomalies.
   */
  async getStats(): Promise<DatabaseStats> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['records', 'plts_customers'], 'readonly');
      const recordStore = tx.objectStore('records');
      const pltsStore = tx.objectStore('plts_customers');

      const recordsByUnitInduk: Record<string, number> = {};
      let totalRecords = 0;
      let totalCustomers = 0;
      let totalNonCustomers = 0;
      let anomalyRecordsCount = 0;
      let totalPlts = 0;

      const pltsCountReq = pltsStore.count();
      pltsCountReq.onsuccess = () => {
        totalPlts = pltsCountReq.result;
      };

      const cursorReq = recordStore.openCursor();
      cursorReq.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const rec: AMRRecord = cursor.value;
          totalRecords++;
          const unit = rec.unitIndukCode || rec.locationCode.substring(0, 2) || '52';
          recordsByUnitInduk[unit] = (recordsByUnitInduk[unit] || 0) + 1;

          if (rec.isCustomer !== false) {
            totalCustomers++;
          } else {
            totalNonCustomers++;
          }

          if (rec.anomalies && rec.anomalies.length > 0) {
            anomalyRecordsCount++;
          }

          cursor.continue();
        } else {
          // Estimate storage: ~1.2 KB per record on average
          const storageEstimateMb = Math.round((totalRecords * 1.2) / 1024 * 10) / 10;
          resolve({
            totalRecords,
            recordsByUnitInduk,
            totalCustomers,
            totalNonCustomers,
            totalPlts,
            anomalyRecordsCount,
            storageEstimateMb,
          });
        }
      };

      cursorReq.onerror = () => reject(tx.error);
    });
  }

  /**
   * Clear all records in database.
   */
  async clearRecords(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      const store = tx.objectStore('records');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * PLTS Rooftop customer management
   */
  async savePltsCustomer(item: PltsCustomerRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('plts_customers', 'readwrite');
      const store = tx.objectStore('plts_customers');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllPltsCustomers(): Promise<PltsCustomerRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('plts_customers', 'readonly');
      const store = tx.objectStore('plts_customers');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deletePltsCustomer(idpel: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('plts_customers', 'readwrite');
      const store = tx.objectStore('plts_customers');
      const req = store.delete(idpel);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const amrDatabase = new AMRDatabase();
