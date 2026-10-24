export interface AMRRecord {
  id: string;
  unitIndukCode: string; // 2 digit awal IDPEL (e.g. '52', '54', '53', '51', '55', '56')
  unitUpi?: string;
  namaUpi?: string;
  unitAp?: string; // UP3
  namaAp?: string;
  unitUp?: string; // ULP
  namaUp?: string;
  locationCode: string; // ID Pelanggan (11-12 digit)
  namaPelanggan: string;
  assetMeterCode: string; // Nomor seri meter
  merkMeter: string; // WASION, HEXING, EDMI, etc.
  typeMeter: string;
  tariff: string; // B2, I2, B3, etc.
  power: number; // Daya terpasang (VA)
  phaseType: '1-Phase' | '3-Phase'; // 1-Phase atau 3-Phase (tanpa tanda kurung)
  periode?: string;
  readDate: string; // Waktu pembacaan instant
  isCustomer: boolean; // True jika pelanggan, False jika Non-Pelanggan (PJU, Gardu, Aset, Testing)
  
  // Tegangan (Volt)
  voltageL1: number; // VR
  voltageL2: number; // VS
  voltageL3: number; // VT
  voltageAngleL1: number; // Sudut VR
  voltageAngleL2: number; // Sudut VS
  voltageAngleL3: number; // Sudut VT
  
  // Arus (Ampere)
  currentL1: number; // IR
  currentL2: number; // IS
  currentL3: number; // IT
  currentN: number;  // IN (Arus Netral)
  currentAngleL1: number; // Sudut IR
  currentAngleL2: number; // Sudut IS
  currentAngleL3: number; // Sudut IT
  
  // Analisis Ketidakseimbangan (IEEE Std 141)
  voltageUnbalancePct: number; // % Ketidakseimbangan Tegangan
  currentUnbalancePct: number; // % Ketidakseimbangan Arus
  
  // Analisis Harmonisa / Kualitas Daya (THD - IEEE 519 / IEC 61000-4-30)
  thdVoltage: {
    r: number;
    s: number;
    t: number;
    avg: number;
  };
  thdCurrent: {
    r: number;
    s: number;
    t: number;
    avg: number;
  };
  
  // Power Factor / Cosphi
  powerFactorL1: number;
  powerFactorL2: number;
  powerFactorL3: number;
  powerFactorTotal: number;
  
  // Daya Aktif Sekunder Meter (Watt)
  activePowerL1: number;
  activePowerL2: number;
  activePowerL3: number;
  activePowerTotal: number;

  // Faktor Kali (FK = Rasio CT x Rasio PT) & Pemakaian Aktual (kW = Watt / 1000 * FK)
  multiplier: number; // Faktor Kali
  actualPowerKw: number; // Pemakaian Aktual Primer (kW)
  actualPowerKwL1: number;
  actualPowerKwL2: number;
  actualPowerKwL3: number;
  
  // Daya Reaktif (VAR atau kVAR)
  reactivePowerL1: number;
  reactivePowerL2: number;
  reactivePowerL3: number;
  reactivePowerTotal: number;
  
  // Daya Semu (VA atau kVA)
  apparentPowerL1: number;
  apparentPowerL2: number;
  apparentPowerL3: number;
  apparentPowerTotal: number;
  
  // Energi Kumulatif & Stand Absolut (kWh & kVARh)
  kwhImportTotal?: number;
  kwhExportTotal?: number;
  kvarhImportTotal?: number;
  standKwhImport: number;   // Stand Absolut kWh Import (akumulasi register meter)
  standKwhExport: number;   // Stand Absolut kWh Export (PLTS / kirim ke grid)
  standKvarh: number;       // Stand Absolut kVARh
  frequency?: number;
  
  // Koordinat Geospasial untuk Pemetaan Google Maps & Rute Petugas
  latitude?: number;
  longitude?: number;
  
  // Deduplikasi & Temuan Historis
  sameIdpelAnomalyCount?: number; // Jumlah total temuan anomali pada IDPEL yang sama
  
  // Profil PLTS Terpasang (Pembangkit Listrik Tenaga Surya)
  isPlts?: boolean;
  pltsCapacityKwp?: number;
  
  // Data Historis 12 Bulan (untuk regresi prediktif & grafik kumulatif)
  historical12Months?: MonthlyAmrHistory[];
  
  // Hasil Analisa Diagnostik
  anomalies: AMRAnomaly[];
  healthScore: number; // 0 - 100
  isMediumVoltage: boolean; // TM (sekunder PT ~57.7V) vs TR (~230V)
}

export interface MonthlyAmrHistory {
  month: string; // e.g. "2025-11", "2026-03"
  label: string; // e.g. "Nov 25", "Mar 26"
  kwhImport: number;
  kwhExport: number;
  kvarh: number;
  pf: number;
  healthScore: number;
  unbalancePct: number;
  anomalyCount: number;
  vAvg: number;
  iAvg: number;
}

export type AnomalySeverity = 'critical' | 'warning' | 'info';

export type AnomalyCategory = 
  | 'wiring_reverse'     // CT Terbalik / Polaritas K-L terbalik
  | 'voltage_loss'       // Hilang Tegangan Fasa
  | 'voltage_unbalance'  // Tegangan Tidak Seimbang (> 5% IEEE)
  | 'voltage_abnormal'   // Under / Over Voltage
  | 'current_loss'       // Arus Fasa Hilang
  | 'current_unbalance'  // Arus Tidak Seimbang Ekstrem (> 10% / > 20% IEEE 141)
  | 'neutral_high'       // Arus Netral Tinggi
  | 'cosphi_low'         // Cosphi < 0.85 (Denda kVARh)
  | 'cosphi_negative'    // Cosphi Negatif (Arus Balik / PLTS tanpa izin)
  | 'power_negative'     // Daya Aktif Fasa Negatif
  | 'sequence_inverted'  // Urutan Fasa Terbalik
  | 'harmonic_high'      // THD Tinggi (IEEE 519)
  | 'p2tl_violation';    // Dugaan Pelanggaran P2TL (Perdir 028)

// Rujukan Standar Penertiban Pemakaian Tenaga Listrik (P2TL) Berdasarkan Perdir Direksi PLN No. 028.P/DIR/2023
export type P2TLGolongan = 
  | 'Golongan I (K1)'   // Mempengaruhi Batas Daya (MCB/Pembatas)
  | 'Golongan II (K2)'  // Mempengaruhi Pengukuran Energi (kWh/kVARh Meter, CT, PT)
  | 'Golongan III (K3)' // Mempengaruhi Batas Daya dan Pengukuran Energi (K1 + K2)
  | 'Golongan IV (K4)'  // Pengambilan tenaga listrik tanpa hak oleh Bukan Pelanggan
  | 'Tertib (Normal)';

export interface AMRAnomaly {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  description: string;
  affectedPhase: 'R' | 'S' | 'T' | 'All' | 'N';
  value: string;
  recommendation: string;
  p2tlGolongan?: P2TLGolongan;
  standardReference?: string; // e.g. "Perdir 028 Gol. II", "IEEE Std 141", "IEEE Std 519", "IEC 62053-22", "ANSI C12.20"
}

export type UserRole = 'admin' | 'supervisor' | 'analyst' | 'p2tl' | 'viewer';

export interface UserPermissions {
  canView: boolean;
  canAnalyze: boolean;
  canUpload: boolean;
  canExport: boolean;
  canManageUsers: boolean;
  canSendEmailAlert: boolean;
  canPrintBA: boolean;
}

export const PLN_AVAILABLE_UNITS = [
  'UP3 Kudus (Semua ULP)',
  'ULP Kudus Kota',
  'ULP Pati',
  'ULP Rembang',
  'ULP Blora',
  'ULP Cepu',
  'ULP Jepara',
  'ULP Bangsri',
  'UID Jawa Tengah & DIY (Semua Unit)',
] as const;

export type PLNUnitType = typeof PLN_AVAILABLE_UNITS[number] | string;

export interface MaintenancePhoto {
  id: string;
  caption: string;
  dataUrl: string;
  timestamp: string;
}

export interface MaintenanceRecord {
  id: string;
  idpel: string;
  namaPelanggan: string;
  tarif: string;
  daya: number;
  unitUp: string; // e.g. 'ULP Kudus Kota'
  tanggal: string; // YYYY-MM-DD or datetime
  petugasNama: string;
  petugasId: string;
  regu: string;
  noSuratTugas?: string;
  tindakanKategori: string[];
  tindakanDetail: string;
  status: 'selesai' | 'belum_selesai';
  catatanKendala?: string;
  pengukuran: {
    vr: number;
    vs: number;
    vt: number;
    vAvg: number;
    ir: number;
    is: number;
    it: number;
    in: number;
    cosphiTotal: number;
    cosphiR?: number;
    cosphiS?: number;
    cosphiT?: number;
    sudutVR?: number;
    sudutVS?: number;
    sudutVT?: number;
    sudutIR?: number;
    sudutIS?: number;
    sudutIT?: number;
    standKwhImport?: number;
    standKwhExport?: number;
    standKvarh?: number;
    unbalanceV?: number;
    unbalanceI?: number;
  };
  fotoList: MaintenancePhoto[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string; // Harus berakhiran @pln.co.id
  phoneNumber?: string; // Nomor WhatsApp
  is2FAVerified?: boolean;
  role: UserRole;
  unit: PLNUnitType;
  avatarBg: string;
  avatarUrl?: string;
  createdAt?: string;
  lastLogin?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canView: true,
    canAnalyze: true,
    canUpload: true,
    canExport: true,
    canManageUsers: true,
    canSendEmailAlert: true,
    canPrintBA: true,
  },
  supervisor: {
    canView: true,
    canAnalyze: true,
    canUpload: true,
    canExport: true,
    canManageUsers: false,
    canSendEmailAlert: true,
    canPrintBA: true,
  },
  analyst: {
    canView: true,
    canAnalyze: true,
    canUpload: true,
    canExport: true,
    canManageUsers: false,
    canSendEmailAlert: true,
    canPrintBA: true,
  },
  p2tl: {
    canView: true,
    canAnalyze: true,
    canUpload: false,
    canExport: true,
    canManageUsers: false,
    canSendEmailAlert: true,
    canPrintBA: true,
  },
  viewer: {
    canView: true,
    canAnalyze: false,
    canUpload: false,
    canExport: false,
    canManageUsers: false,
    canSendEmailAlert: false,
    canPrintBA: false,
  },
};

export interface FilterState {
  searchQuery: string;
  category: string;
  merkMeter: string;
  tariff: string;
  unitInduk: string; // 2 digit prefix, e.g. "all", "52", "54", "53", "51"
  customerType: 'all' | 'customer' | 'non_customer'; // Filter Customer vs Non-Customer
  unitAp: string; // UP3
  unitUp: string; // ULP
  voltageLevel: 'all' | 'TR' | 'TM';
  phaseType: 'all' | '1-Phase' | '3-Phase';
  sortBy: 'health' | 'name' | 'idpel' | 'power' | 'anomalies' | 'current' | 'unbalance';
  sortOrder: 'asc' | 'desc';
}

export interface AppNotification {
  id: string;
  timestamp: string;
  type: 'error' | 'warning' | 'success' | 'info';
  severity?: AnomalySeverity;
  category?: AnomalyCategory;
  title: string;
  message: string;
  read: boolean;
  relatedIdpel?: string;
  customerName?: string;
  affectedPhase?: 'R' | 'S' | 'T' | 'All' | 'N';
  value?: string;
  recommendation?: string;
  emailedTo?: string;
}

export interface EmailDispatchRecord {
  id: string;
  timestamp: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyPreview?: string;
  previewSnippet?: string;
  customerCount?: number;
  criticalCount?: number;
  highestSeverity?: string;
  status: 'sent' | 'failed';
}

export interface FileValidationSummary {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: string[];
  datesFound: string[];
  isSuccess: boolean;
  error?: string;
  removedDuplicatesCount?: number;
  sheetsCount?: number;
  sheetsProcessed?: string[];
  fileType?: 'instant' | 'load_profile';
  fileSizeMb?: number;
  unitIndukDetected?: string;
}

// Model Regresi Prediktif Anomali & Kerusakan Komponen Meter (12 Bulan)
export interface AnomalyRegressionPrediction {
  idpel: string;
  namaPelanggan: string;
  currentHealthScore: number;
  historicalPointsCount: number;
  slope: number; // Laju degradasi per bulan
  intercept: number;
  rSquared: number; // Koefisien determinasi R^2
  predictedHealth30Days: number;
  predictedHealth60Days: number;
  predictedHealth90Days: number;
  predictedHealth180Days: number;
  failureRiskProbability: number; // 0% - 100%
  suspectedComponent: 'CT_Saturation' | 'PT_Drift' | 'Relay_Stuck' | 'Metering_Firmware' | 'Terminal_Overheat' | 'Wiring_Wear';
  componentRiskLabel: string;
  recommendationAction: string;
}

// Data Petugas & Rute Pemeliharaan di Google Maps
export interface MaintenanceOfficer {
  id: string;
  name: string;
  nip: string;
  vehiclePlate: string;
  unitUp3: string;
  currentLat: number;
  currentLng: number;
  status: 'available' | 'on_route' | 'inspecting' | 'completed';
  assignedIdpels: string[];
}

export interface MaintenanceWaypoint {
  idpel: string;
  namaPelanggan: string;
  address: string;
  latitude: number;
  longitude: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  p2tlGolongan: string;
  estimatedVisitDurationMin: number;
  distanceFromPreviousKm: number;
  estimatedArrivalTimestamp: string;
}

export interface PltsCustomerRecord {
  idpel: string;
  namaPelanggan: string;
  tariff: string;
  capacityKwp: number;
  inverterBrand: string;
  codDate: string; // Tanggal pengoperasian
  netMeteringApproved: boolean;
  unitUp3: string;
  unitUlp: string;
  notes?: string;
}

// Standar Daya PLN Indonesia (1-Phase vs 3-Phase) Revisi Resmi
export const PLN_POWER_RATINGS: Record<number, '1-Phase' | '3-Phase'> = {
  220: '1-Phase',
  250: '1-Phase',
  450: '1-Phase',
  900: '1-Phase',
  1300: '1-Phase',
  2200: '1-Phase',
  3500: '1-Phase',
  3900: '3-Phase',
  4400: '1-Phase',
  5500: '1-Phase',
  6600: '3-Phase',
  7700: '1-Phase',
  8000: '1-Phase',
  9000: '1-Phase',
  10600: '3-Phase',
  11000: '1-Phase',
  13200: '3-Phase',
  13900: '1-Phase',
  15400: '1-Phase',
  16500: '3-Phase',
  17000: '1-Phase',
  17600: '1-Phase',
  22000: '1-Phase', // 22.000 VA adalah 1-Phase
  23000: '3-Phase', // 23.000 VA adalah 3-Phase
};

export function determinePhaseType(power: number, voltageL2: number = 0, voltageL3: number = 0): '1-Phase' | '3-Phase' {
  let p = power;
  if (p > 0 && p < 100) {
    p = Math.round(p * 1000);
  }

  // Khusus daya 22.000 VA mutlak 1-Phase
  if (p === 22000 || power === 22) return '1-Phase';

  if (PLN_POWER_RATINGS[p]) {
    return PLN_POWER_RATINGS[p];
  }

  if (p >= 23000) return '3-Phase';
  if (voltageL2 > 20 || voltageL3 > 20) return '3-Phase';

  return '1-Phase';
}
