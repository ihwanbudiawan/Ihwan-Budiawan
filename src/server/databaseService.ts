import fs from 'fs';
import path from 'path';

export interface ServerBatchRecord {
  id: string;
  fileName: string;
  fileType: 'instant' | 'load_profile';
  uploadTimestamp: string;
  month: number;
  year: number;
  recordCount: number;
  criticalCount: number;
  warningCount: number;
  totalKva: number;
  unit: string;
}

export interface ServerEvaluationRecord {
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

interface DatabaseSchema {
  batches: ServerBatchRecord[];
  evaluations: ServerEvaluationRecord[];
  maintenance: any[];
  lastUpdated: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const INITIAL_DB: DatabaseSchema = {
  batches: [
    {
      id: 'batch-srv-20261013',
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
      id: 'batch-srv-20260920',
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
      id: 'batch-srv-20260815',
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
  ],
  evaluations: [
    {
      id: 'eval-srv-001',
      timestamp: '2026-10-13 16:00:00',
      dateStr: '13 Oktober 2026',
      title: 'Evaluasi Rutin Bulanan AMR UP3 Kudus',
      totalCustomers: 1500,
      criticalCount: 12,
      warningCount: 45,
      avgCosphi: 0.912,
      avgHealthScore: 88.4,
      notes: 'Ditemukan 12 kasus potensi pengawatan CT terbalik. Telah diterbitkan Berita Acara P2TL untuk tindak lanjut lapangan.',
      evaluatedBy: 'Ihwan Budiawan',
    },
  ],
  maintenance: [
    {
      id: 'maint-20261020-001',
      idpel: '521010892011',
      namaPelanggan: 'PT DJARUM OASIS FACTORY',
      tarif: 'I3 / 1.385 kVA',
      daya: 1385000,
      unitUp: 'ULP Kudus Kota',
      tanggal: '2026-10-20 10:30',
      petugasNama: 'Bambang S. & Tim P2TL',
      petugasId: 'P2TL-5210-09',
      regu: 'Tim P2TL & Harwat Meter UP3 Kudus',
      noSuratTugas: 'ST/089/P2TL/KDS/2026',
      tindakanKategori: ['Penukaran Polaritas Terminal K-L CT', 'Pemasangan Segel Metrologi & PLN Baru'],
      tindakanDetail: 'Dilakukan penukaran polaritas kabel pengawatan sekunder CT fasa S yang terpasang terbalik. Setelah ditukar, arah daya aktif kembali positif (+542 kW). Segel baru terpasang No. PLNKDS-99214.',
      status: 'selesai',
      catatanKendala: 'Pekerjaan selesai lancar dalam waktu 45 menit tanpa pemadaman pelanggan.',
      pengukuran: {
        vr: 57.8,
        vs: 57.6,
        vt: 57.7,
        vAvg: 57.7,
        ir: 3.42,
        is: 3.39,
        it: 3.45,
        in: 0.08,
        cosphiTotal: 0.942,
        cosphiR: 0.941,
        cosphiS: 0.945,
        cosphiT: 0.940,
        sudutVR: 0,
        sudutVS: 240,
        sudutVT: 120,
        sudutIR: 19.5,
        sudutIS: 259.2,
        sudutIT: 139.8,
        standKwhImport: 1845920,
        standKwhExport: 0,
        standKvarh: 421090,
        unbalanceV: 0.2,
        unbalanceI: 1.1,
      },
      fotoList: [],
      createdAt: '2026-10-20 11:20:00',
    },
    {
      id: 'maint-20261018-002',
      idpel: '521020481920',
      namaPelanggan: 'CV MEBEL JATI PATI SEJAHTERA',
      tarif: 'I2 / 197 kVA',
      daya: 197000,
      unitUp: 'ULP Pati',
      tanggal: '2026-10-18 14:15',
      petugasNama: 'Rian Pratama, S.T.',
      petugasId: 'HAR-5210-21',
      regu: 'Tim Pemeliharaan APP ULP Pati',
      noSuratTugas: 'ST/055/HAR/PTI/2026',
      tindakanKategori: ['Penggantian Fuse Pengaman Tegangan Fasa S', 'Pembersihan Terminal APP'],
      tindakanDetail: 'Penggantian fuse tegangan fasa S yang putus di boks pembagi. Tegangan VS yang semula 0V kini normal 231.2V.',
      status: 'selesai',
      catatanKendala: 'Terminal boks berdebu tebal, telah dibersihkan dan diisolasi ulang.',
      pengukuran: {
        vr: 230.5,
        vs: 231.2,
        vt: 229.8,
        vAvg: 230.5,
        ir: 220.4,
        is: 218.6,
        it: 222.1,
        in: 4.2,
        cosphiTotal: 0.915,
        cosphiR: 0.912,
        cosphiS: 0.918,
        cosphiT: 0.915,
        standKwhImport: 894200,
        standKwhExport: 0,
        standKvarh: 194300,
        unbalanceV: 0.4,
        unbalanceI: 1.2,
      },
      fotoList: [],
      createdAt: '2026-10-18 15:00:00',
    },
    {
      id: 'maint-20261022-003',
      idpel: '521030994102',
      namaPelanggan: 'PABRIK ES BALOK REMBANG JAYA',
      tarif: 'I3 / 865 kVA',
      daya: 865000,
      unitUp: 'ULP Rembang',
      tanggal: '2026-10-22 09:00',
      petugasNama: 'Hendra & Tim Proteksi',
      petugasId: 'PROT-5210-14',
      regu: 'Tim Proteksi & Pengukuran UP3 Kudus',
      noSuratTugas: 'ST/102/P2TL/RMB/2026',
      tindakanKategori: ['Penggantian CT Rasio 150/5A (Sedang Berlangsung)', 'Permintaan Izin Padam'],
      tindakanDetail: 'Ditemukan saturasi CT fasa T pada beban puncak. Diperlukan penggantian CT rasio 200/5A kelas 0.2S. Menunggu jadwal pemadaman koordinasi dengan bagian produksi pabrik es.',
      status: 'belum_selesai',
      catatanKendala: 'Pelanggan meminta pekerjaan dilaksanakan hari Minggu saat shift produksi libur.',
      pengukuran: {
        vr: 57.9,
        vs: 57.8,
        vt: 56.4,
        vAvg: 57.3,
        ir: 2.85,
        is: 2.80,
        it: 1.45,
        in: 1.20,
        cosphiTotal: 0.820,
        unbalanceV: 1.5,
        unbalanceI: 35.2,
      },
      fotoList: [],
      createdAt: '2026-10-22 10:00:00',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

function ensureDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return INITIAL_DB;
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

export function getServerBatches(filters?: { month?: number; year?: number; fileType?: string }): ServerBatchRecord[] {
  const db = ensureDB();
  let list = db.batches;
  if (filters?.fileType && filters.fileType !== 'all') {
    list = list.filter((b) => b.fileType === filters.fileType);
  }
  if (filters?.month && filters.month > 0) {
    list = list.filter((b) => b.month === filters.month);
  }
  if (filters?.year && filters.year > 0) {
    list = list.filter((b) => b.year === filters.year);
  }
  return list.sort((a, b) => b.uploadTimestamp.localeCompare(a.uploadTimestamp));
}

export function saveServerBatch(batch: ServerBatchRecord): ServerBatchRecord {
  const db = ensureDB();
  db.batches = [batch, ...db.batches.filter((b) => b.id !== batch.id)];
  writeDB(db);
  return batch;
}

export function deleteServerBatch(id: string): boolean {
  const db = ensureDB();
  const initialLen = db.batches.length;
  db.batches = db.batches.filter((b) => b.id !== id);
  writeDB(db);
  return db.batches.length < initialLen;
}

export function bulkDeleteServerBatches(ids: string[]): number {
  const db = ensureDB();
  const set = new Set(ids);
  const before = db.batches.length;
  db.batches = db.batches.filter((b) => !set.has(b.id));
  writeDB(db);
  return before - db.batches.length;
}

export function getServerEvaluations(): ServerEvaluationRecord[] {
  const db = ensureDB();
  return db.evaluations.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function saveServerEvaluation(evaluation: ServerEvaluationRecord): ServerEvaluationRecord {
  const db = ensureDB();
  db.evaluations = [evaluation, ...db.evaluations.filter((e) => e.id !== evaluation.id)];
  writeDB(db);
  return evaluation;
}

export function getServerMaintenance(): any[] {
  const db = ensureDB();
  return (db.maintenance || []).sort((a: any, b: any) => (b.tanggal || '').localeCompare(a.tanggal || ''));
}

export function saveServerMaintenance(record: any): any {
  const db = ensureDB();
  const current = db.maintenance || [];
  db.maintenance = [record, ...current.filter((m: any) => m.id !== record.id)];
  writeDB(db);
  return record;
}

export function deleteServerMaintenance(id: string): boolean {
  const db = ensureDB();
  const current = db.maintenance || [];
  const before = current.length;
  db.maintenance = current.filter((m: any) => m.id !== id);
  writeDB(db);
  return db.maintenance.length < before;
}

// Aliases
export const getAllBatches = getServerBatches;
export const saveBatch = saveServerBatch;
export const deleteBatch = deleteServerBatch;
export const bulkDeleteBatches = bulkDeleteServerBatches;
export const getAllEvaluations = getServerEvaluations;
export const saveEvaluation = saveServerEvaluation;
export const getMaintenance = getServerMaintenance;
export const saveMaintenance = saveServerMaintenance;
export const deleteMaintenance = deleteServerMaintenance;
