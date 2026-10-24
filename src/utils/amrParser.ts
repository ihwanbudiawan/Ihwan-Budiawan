import * as XLSX from 'xlsx';
import { AMRRecord, determinePhaseType, FileValidationSummary, MonthlyAmrHistory } from '../types/amr';
import { detectAMRAnomalies } from './anomalyDetector';
import { PLN_UNIT_INDUK_MAP } from './unitInduk';

export function parseNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim();
  if (!str) return 0;

  // Format Indonesia: 1.234,56 atau 239,8419
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (semicolons >= commas && semicolons >= tabs) return ';';
  if (tabs > commas) return '\t';
  return ',';
}

export interface ParsedAmrDate {
  formatted: string;
  dateKey: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timestamp: number;
}

export function parseAmrDateString(rawVal: any): ParsedAmrDate {
  const now = new Date();
  if (rawVal === undefined || rawVal === null || rawVal === '') {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const h = now.getHours();
    const min = now.getMinutes();
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      formatted: `${dateKey} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      dateKey,
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      timestamp: now.getTime(),
    };
  }

  // If Excel numeric serial date (e.g. 45578.5)
  if (typeof rawVal === 'number' && rawVal > 30000 && rawVal < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 86400 * 1000;
    const date = new Date(excelEpoch.getTime() + rawVal * msPerDay);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = date.getMinutes();
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      formatted: `${dateKey} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      dateKey,
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      timestamp: date.getTime(),
    };
  }

  let str = String(rawVal).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    const h = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      formatted: `${dateKey} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      dateKey,
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      timestamp: new Date(y, m - 1, d, h, min).getTime(),
    };
  }

  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    const h = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const min = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      formatted: `${dateKey} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      dateKey,
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      timestamp: new Date(y, m - 1, d, h, min).getTime(),
    };
  }

  // Fallback
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const h = dt.getHours();
    const min = dt.getMinutes();
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      formatted: `${dateKey} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      dateKey,
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      timestamp: parsed,
    };
  }

  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    formatted: `${dateKey} 00:00:00`,
    dateKey,
    year: y,
    month: m,
    day: d,
    hour: 0,
    minute: 0,
    timestamp: now.getTime(),
  };
}

/**
 * Generate synthetic deterministic 12-month historical consumption data based on customer's power rating and load.
 */
function generate12MonthHistory(locationCode: string, power: number, actualKw: number, pfTotal: number, baseHealth: number): MonthlyAmrHistory[] {
  const months: MonthlyAmrHistory[] = [];
  const monthLabels = ['Nov 25', 'Des 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'Mei 26', 'Jun 26', 'Jul 26', 'Agu 26', 'Sep 26', 'Okt 26'];
  const monthCodes = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

  const seed = locationCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseMonthlyKwh = Math.max(500, (actualKw > 0 ? actualKw : power / 1000 * 0.4) * 24 * 30);
  const isSolarCustomer = (seed % 7) === 0;

  for (let i = 0; i < 12; i++) {
    // Seasonal variation factor (~0.85 to 1.15)
    const seasonalFactor = 0.90 + 0.20 * Math.sin((i / 11) * Math.PI * 2 + (seed % 10));
    const noise = ((seed * (i + 1) * 31) % 100) / 500 - 0.1;
    const factor = Math.max(0.6, seasonalFactor + noise);

    const kwhImport = Math.round(baseMonthlyKwh * factor);
    const kwhExport = isSolarCustomer ? Math.round(baseMonthlyKwh * 0.25 * (1 + 0.3 * Math.sin(i))) : 0;
    const kvarh = Math.round(kwhImport * Math.tan(Math.acos(Math.max(0.6, Math.min(0.98, Math.abs(pfTotal) || 0.88)))));

    // Health score drift over 12 months (e.g. slight degradation if unhealthy)
    const healthNoise = (seed % 5) - 2;
    const health = Math.max(20, Math.min(100, Math.round(baseHealth + (11 - i) * (baseHealth < 70 ? 1.5 : 0.2) + healthNoise)));
    const unbalance = Math.max(2, Math.min(35, Math.round(5 + (i * 0.8) + (seed % 8))));

    months.push({
      month: monthCodes[i],
      label: monthLabels[i],
      kwhImport,
      kwhExport,
      kvarh,
      pf: Math.round((Math.abs(pfTotal) || 0.90) * 100) / 100,
      healthScore: health,
      unbalancePct: unbalance,
      anomalyCount: health < 60 ? 2 : health < 85 ? 1 : 0,
      vAvg: 230 + ((seed + i) % 5) - 2,
      iAvg: Math.round((actualKw * 1000) / (3 * 230 * (Math.abs(pfTotal) || 0.9)) * 10) / 10,
    });
  }

  return months;
}

/**
 * Determine coordinates based on IDPEL, ULP, or Unit Induk
 */
function deriveCoordinates(locationCode: string, unitIndukCode: string, up3Name: string): { lat: number; lng: number } {
  // Center points for PLN distribution areas
  let baseLat = -6.8048;
  let baseLng = 110.8405; // Kudus center default

  if (unitIndukCode === '51') {
    // Jakarta
    baseLat = -6.2088;
    baseLng = 106.8456;
  } else if (unitIndukCode === '53') {
    // Surabaya / Jatim
    baseLat = -7.2575;
    baseLng = 112.7521;
  } else if (unitIndukCode === '54') {
    // Bandung / Jabar
    baseLat = -6.9175;
    baseLng = 107.6191;
  } else if (unitIndukCode === '55') {
    // Banten
    baseLat = -6.1200;
    baseLng = 106.1500;
  } else if (unitIndukCode === '56') {
    // Bali
    baseLat = -8.6705;
    baseLng = 115.2126;
  } else {
    // 52 Jateng & DIY
    if (up3Name.toUpperCase().includes('SEMARANG')) {
      baseLat = -6.9932;
      baseLng = 110.4203;
    } else if (up3Name.toUpperCase().includes('SURAKARTA') || up3Name.toUpperCase().includes('SOLO')) {
      baseLat = -7.5755;
      baseLng = 110.8243;
    } else if (up3Name.toUpperCase().includes('YOGYAKARTA') || up3Name.toUpperCase().includes('DIY')) {
      baseLat = -7.7956;
      baseLng = 110.3695;
    }
  }

  // Deterministic micro-offset by locationCode digits
  const hash = locationCode.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);
  const offsetLat = (((hash * 17) % 1000) / 1000 - 0.5) * 0.12;
  const offsetLng = (((hash * 31) % 1000) / 1000 - 0.5) * 0.12;

  return {
    lat: Math.round((baseLat + offsetLat) * 100000) / 100000,
    lng: Math.round((baseLng + offsetLng) * 100000) / 100000,
  };
}

export function rawRowToAMRRecord(row: Record<string, any>, index: number): AMRRecord | null {
  const norm: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.toUpperCase().trim().replace(/[\s\.\-\/\(\)]/g, '_');
    norm[cleanKey] = row[key];
  }

  // ID Pelanggan
  const locationCode = String(
    norm['IDPEL'] || norm['ID_PEL'] || norm['IDPELANGGAN'] || norm['LOCATION_CODE'] || norm['NO_PELANGGAN'] || norm['NO_PEL'] || norm['KODE_PELANGGAN'] || norm['ID'] || `PEL-${100000 + index}`
  ).trim();

  // 2 Digit Awal Unit Induk
  let unitIndukCode = locationCode.length >= 2 ? locationCode.substring(0, 2) : '52';
  if (!PLN_UNIT_INDUK_MAP[unitIndukCode]) {
    // If prefix is not in map, inspect explicit unit code or default to 52
    const rawUnit = String(norm['UNITUPI'] || norm['UNIT_INDUK'] || norm['KODE_UNIT'] || '').trim();
    if (rawUnit && PLN_UNIT_INDUK_MAP[rawUnit.substring(0, 2)]) {
      unitIndukCode = rawUnit.substring(0, 2);
    } else {
      unitIndukCode = '52';
    }
  }

  const namaPelanggan = String(
    norm['NAMA'] || norm['NAMA_PELANGGAN'] || norm['CUSTOMER_NAME'] || norm['NAMA_KONSUMEN'] || norm['PELANGGAN'] || `Pelanggan ${locationCode}`
  ).trim();

  const assetMeterCode = String(
    norm['NOMETER'] || norm['NO_METER'] || norm['ASSET_METER_CODE'] || norm['SERIAL_NUMBER'] || norm['NOMOR_SERI'] || norm['SERIAL'] || ''
  ).trim();

  // Nama Merk Meter (wajib WASION jika WASIO)
  let merkMeter = String(norm['MERK_METER'] || norm['MERKMETER'] || norm['MERK'] || norm['BRAND'] || 'WASION').trim().toUpperCase();
  if (merkMeter.includes('WASIO')) {
    merkMeter = 'WASION';
  }
  if (!merkMeter || merkMeter === 'UNDEFINED') {
    merkMeter = 'WASION';
  }

  const typeMeter = String(norm['TYPE_METER'] || norm['TYPEMETER'] || norm['TIPE'] || norm['MODEL'] || 'Electronic Static').trim();
  const tariff = String(norm['TARIF'] || norm['TARIFF'] || norm['GOL_TARIF'] || 'B2').trim().toUpperCase();
  const power = parseNumber(norm['DAYA'] || norm['POWER'] || norm['DAYA_VA'] || norm['VA'] || 6600);

  // Status Customer vs Non-Customer
  const isCustomerRaw = norm['IS_CUSTOMER'] ?? norm['CUSTOMER_TYPE'] ?? norm['STATUS_PELANGGAN'];
  let isCustomer = true;
  if (isCustomerRaw !== undefined) {
    const strStatus = String(isCustomerRaw).toUpperCase();
    if (strStatus.includes('NON') || strStatus === '0' || strStatus === 'FALSE') {
      isCustomer = false;
    }
  } else if (tariff.startsWith('NON') || namaPelanggan.toUpperCase().includes('PJU') || namaPelanggan.toUpperCase().includes('GARDU')) {
    isCustomer = false;
  }

  const parsedDate = parseAmrDateString(
    norm['READDATE'] || norm['READ_DATE'] || norm['TANGGAL'] || norm['WAKTU'] || norm['DATETIME'] || norm['DATE'] || norm['PERIODE']
  );
  const periode = parsedDate.dateKey;

  let voltageL1 = parseNumber(norm['VOLTAGE_L1'] || norm['VR'] || norm['V1'] || norm['V_R'] || norm['VOLTAGE'] || norm['TEGANGAN']);
  let voltageL2 = parseNumber(norm['VOLTAGE_L2'] || norm['VS'] || norm['V2'] || norm['V_S']);
  let voltageL3 = parseNumber(norm['VOLTAGE_L3'] || norm['VT'] || norm['V3'] || norm['V_T']);

  const voltageAngleL1 = parseNumber(norm['VOLTAGE_ANGLE_L1'] || norm['ANGLE_V1'] || 0);
  const voltageAngleL2 = parseNumber(norm['VOLTAGE_ANGLE_L2'] || norm['ANGLE_V2'] || 240);
  const voltageAngleL3 = parseNumber(norm['VOLTAGE_ANGLE_L3'] || norm['ANGLE_V3'] || 120);

  let currentL1 = parseNumber(norm['CURRENT_L1'] || norm['IR'] || norm['I1'] || norm['I_R'] || norm['CURRENT'] || norm['ARUS']);
  let currentL2 = parseNumber(norm['CURRENT_L2'] || norm['IS'] || norm['I2'] || norm['I_S']);
  let currentL3 = parseNumber(norm['CURRENT_L3'] || norm['IT'] || norm['I3'] || norm['I_T']);
  
  // Arus Netral (IN): Ambil dari file jika ada, atau hitung via rumus ketidakseimbangan 3 fasa
  let currentN = parseNumber(norm['CURRENT_N'] || norm['IN'] || norm['I_N'] || norm['ARUS_NETRAL']);
  if (currentN === 0 && (currentL1 > 0 || currentL2 > 0 || currentL3 > 0)) {
    // Rumus Aproksimasi Standar Vektor Arus Netral 3 Fasa: sqrt(IR^2 + IS^2 + IT^2 - IR*IS - IS*IT - IR*IT)
    const inSquared = Math.max(0, currentL1 ** 2 + currentL2 ** 2 + currentL3 ** 2 - currentL1 * currentL2 - currentL2 * currentL3 - currentL1 * currentL3);
    currentN = Math.round(Math.sqrt(inSquared) * 100) / 100;
  }

  const currentAngleL1 = parseNumber(norm['CURRENT_ANGLE_L1'] || norm['ANGLE_I1'] || 0);
  const currentAngleL2 = parseNumber(norm['CURRENT_ANGLE_L2'] || norm['ANGLE_I2'] || 0);
  const currentAngleL3 = parseNumber(norm['CURRENT_ANGLE_L3'] || norm['ANGLE_I3'] || 0);

  let powerFactorTotal = parseNumber(norm['POWER_FACTOR_TOTAL'] || norm['PF_TOTAL'] || norm['COSPHI'] || norm['COS_PHI'] || norm['PF'] || norm['FAKTOR_DAYA'] || norm['COSPHI_TOTAL']);
  let powerFactorL1 = parseNumber(norm['POWER_FACTOR_L1'] || norm['PF_L1'] || norm['COSPHI_1']);
  let powerFactorL2 = parseNumber(norm['POWER_FACTOR_L2'] || norm['PF_L2'] || norm['COSPHI_2']);
  let powerFactorL3 = parseNumber(norm['POWER_FACTOR_L3'] || norm['PF_L3'] || norm['COSPHI_3']);

  let activePowerL1 = parseNumber(norm['ACTIVE_POWER_L1'] || norm['P1'] || norm['P_R']);
  let activePowerL2 = parseNumber(norm['ACTIVE_POWER_L2'] || norm['P2'] || norm['P_S']);
  let activePowerL3 = parseNumber(norm['ACTIVE_POWER_L3'] || norm['P3'] || norm['P_T']);
  let activePowerTotal = parseNumber(norm['ACTIVE_POWER_TOTAL'] || norm['PTOTAL'] || norm['P_TOTAL'] || norm['ACTIVE_POWER'] || norm['DAYA_AKTIF']);

  const rawLoadProfileKw = parseNumber(
    norm['KW'] || norm['BEBAN_KW'] || norm['DEMAND_KW'] || norm['KW_MAX'] || norm['KW_TOTAL'] || norm['ACTIVE_POWER_KW'] || norm['P_KW'] || norm['BEBAN'] || norm['P_KW_'] || norm['DAYA_AKTIF_KW']
  );

  const reactivePowerL1 = parseNumber(norm['REACTIVE_POWER_L1'] || norm['Q1']);
  const reactivePowerL2 = parseNumber(norm['REACTIVE_POWER_L2'] || norm['Q2']);
  const reactivePowerL3 = parseNumber(norm['REACTIVE_POWER_L3'] || norm['Q3']);
  const reactivePowerTotal = parseNumber(norm['REACTIVE_POWER_TOTAL'] || norm['QTOTAL'] || norm['REACTIVE_POWER'] || norm['KVAR'] || norm['KVARH_PER_HOUR']);

  const apparentPowerL1 = parseNumber(norm['APPARENT_POWER_L1'] || norm['S1']);
  const apparentPowerL2 = parseNumber(norm['APPARENT_POWER_L2'] || norm['S2']);
  const apparentPowerL3 = parseNumber(norm['APPARENT_POWER_L3'] || norm['S3']);
  const apparentPowerTotal = parseNumber(norm['APPARENT_POWER_TOTAL'] || norm['STOTAL'] || norm['KVA']);

  // Stand Absolut kWh & kVARh
  const standKwhImport = parseNumber(
    norm['STAND_KWH_IMPORT'] || norm['KWH_IMPORT_TOTAL'] || norm['STAND_KWH'] || norm['KWH_IMPORT'] || norm['KWH'] || norm['STAND_METER'] || (power * 1.5 + (index * 137) % 5000)
  );
  const standKwhExport = parseNumber(norm['STAND_KWH_EXPORT'] || norm['KWH_EXPORT_TOTAL'] || norm['KWH_EXPORT'] || norm['KWH_EXP'] || 0);
  const standKvarh = parseNumber(norm['STAND_KVARH'] || norm['KVARH_IMPORT_TOTAL'] || norm['STAND_KVAR'] || norm['KVARH'] || (standKwhImport * 0.28));

  const frequency = parseNumber(norm['FREQUENCY'] || norm['FREQ'] || 50.0);
  const phaseType = determinePhaseType(power, voltageL2, voltageL3);

  // Perhitungan Faktor Kali (FK)
  const parsedFk = parseNumber(norm['FAKTOR_KALI'] || norm['FK'] || norm['MULTIPLIER'] || norm['CT_RATIO'] || norm['FAKTORKALI']);
  let multiplier = parsedFk > 0 ? parsedFk : 1;
  if (!parsedFk) {
    const isTM = (voltageL1 > 20 && voltageL1 < 140) || (voltageL2 > 20 && voltageL2 < 140);
    if (isTM) {
      multiplier = power >= 1000000 ? 1000 : power >= 200000 ? 200 : 80;
    } else if (power > 33000) {
      multiplier = Math.max(1, Math.round(power / (3 * 230 * 5)));
    } else {
      multiplier = 1;
    }
  }

  // Pemakaian Sebenarnya (kW)
  let actualPowerKw = 0;
  if (rawLoadProfileKw > 0) {
    actualPowerKw = rawLoadProfileKw;
    if (activePowerTotal === 0) {
      activePowerTotal = Math.round((rawLoadProfileKw * 1000) / multiplier);
    }
  } else {
    actualPowerKw = (activePowerTotal / 1000) * multiplier;
  }

  // Nominal fallback untuk tegangan jika nol
  if (voltageL1 === 0 && (actualPowerKw > 0 || currentL1 > 0)) {
    voltageL1 = 230;
    voltageL2 = 230;
    voltageL3 = 230;
  }

  if (currentL1 === 0 && actualPowerKw > 0 && voltageL1 > 0) {
    const pf = powerFactorTotal > 0 ? Math.abs(powerFactorTotal) : 0.90;
    const estI = Math.round(((actualPowerKw * 1000) / (Math.sqrt(3) * voltageL1 * pf)) * 10) / 10;
    currentL1 = estI;
    currentL2 = estI;
    currentL3 = estI;
  }

  const actualPowerKwL1 = (activePowerL1 / 1000) * multiplier;
  const actualPowerKwL2 = (activePowerL2 / 1000) * multiplier;
  const actualPowerKwL3 = (activePowerL3 / 1000) * multiplier;

  // THD Harmonisa (IEEE 519)
  const thdV1 = parseNumber(norm['THD_V1'] || norm['THD_VR'] || 1.8 + ((index * 3) % 25) / 10);
  const thdV2 = parseNumber(norm['THD_V2'] || norm['THD_VS'] || 1.9 + ((index * 5) % 25) / 10);
  const thdV3 = parseNumber(norm['THD_V3'] || norm['THD_VT'] || 2.1 + ((index * 7) % 25) / 10);
  const avgThdV = Math.round(((thdV1 + thdV2 + thdV3) / 3) * 10) / 10;

  const thdI1 = parseNumber(norm['THD_I1'] || norm['THD_IR'] || 3.5 + ((index * 9) % 80) / 10);
  const thdI2 = parseNumber(norm['THD_I2'] || norm['THD_IS'] || 3.8 + ((index * 11) % 80) / 10);
  const thdI3 = parseNumber(norm['THD_I3'] || norm['THD_IT'] || 4.1 + ((index * 13) % 80) / 10);
  const avgThdI = Math.round(((thdI1 + thdI2 + thdI3) / 3) * 10) / 10;

  const namaAp = String(norm['NAMAAP'] || norm['NAMA_AP'] || norm['UP3'] || norm['NAMA_UP3'] || 'UP3 KUDUS').trim();
  const coords = deriveCoordinates(locationCode, unitIndukCode, namaAp);

  const baseRecord: Omit<AMRRecord, 'anomalies' | 'healthScore' | 'isMediumVoltage' | 'voltageUnbalancePct' | 'currentUnbalancePct'> = {
    id: `${locationCode}-${assetMeterCode || ''}-${periode || ''}-${parsedDate.hour ?? ''}-${index}`,
    unitIndukCode,
    unitUpi: String(norm['UNITUPI'] || 'UID JATENG').trim(),
    namaUpi: String(norm['NAMAUPI'] || 'JAWA TENGAH & D.I. YOGYAKARTA').trim(),
    unitAp: String(norm['UNITAP'] || norm['UNIT_AP'] || '52100').trim(),
    namaAp,
    unitUp: String(norm['UNITUP'] || norm['UNIT_UP'] || norm['ULP'] || '52101').trim(),
    namaUp: (() => {
      const explicit = String(norm['NAMAUP'] || norm['NAMA_UP'] || norm['NAMA_ULP'] || '').trim();
      if (explicit && explicit.length > 3) return explicit;
      const KUDUS_ULP_LIST = [
        'ULP Kudus Kota',
        'ULP Pati',
        'ULP Rembang',
        'ULP Blora',
        'ULP Cepu',
        'ULP Jepara',
        'ULP Bangsri',
      ];
      const seed = Math.abs(parseInt(locationCode.slice(-3), 10) || (index * 7));
      return KUDUS_ULP_LIST[seed % KUDUS_ULP_LIST.length];
    })(),
    locationCode,
    namaPelanggan,
    assetMeterCode,
    merkMeter,
    typeMeter,
    tariff,
    power,
    phaseType,
    periode,
    readDate: parsedDate.formatted,
    isCustomer,

    voltageL1,
    voltageL2,
    voltageL3,
    voltageAngleL1,
    voltageAngleL2,
    voltageAngleL3,

    currentL1,
    currentL2,
    currentL3,
    currentN,
    currentAngleL1,
    currentAngleL2,
    currentAngleL3,

    thdVoltage: { r: thdV1, s: thdV2, t: thdV3, avg: avgThdV },
    thdCurrent: { r: thdI1, s: thdI2, t: thdI3, avg: avgThdI },

    powerFactorL1,
    powerFactorL2,
    powerFactorL3,
    powerFactorTotal,

    activePowerL1,
    activePowerL2,
    activePowerL3,
    activePowerTotal,

    multiplier,
    actualPowerKw,
    actualPowerKwL1,
    actualPowerKwL2,
    actualPowerKwL3,

    reactivePowerL1,
    reactivePowerL2,
    reactivePowerL3,
    reactivePowerTotal,

    apparentPowerL1,
    apparentPowerL2,
    apparentPowerL3,
    apparentPowerTotal,

    kwhImportTotal: standKwhImport,
    kwhExportTotal: standKwhExport,
    kvarhImportTotal: standKvarh,
    standKwhImport,
    standKwhExport,
    standKvarh,
    frequency,

    latitude: parseNumber(norm['LATITUDE'] || norm['LAT']) || coords.lat,
    longitude: parseNumber(norm['LONGITUDE'] || norm['LNG'] || norm['LON']) || coords.lng,
    isPlts: standKwhExport > 10,
    pltsCapacityKwp: standKwhExport > 10 ? Math.round((power / 1000) * 0.7 * 10) / 10 : undefined,
  };

  const detection = detectAMRAnomalies(baseRecord);

  // Generate synthetic 12-month historical consumption points
  const history12 = generate12MonthHistory(locationCode, power, actualPowerKw, powerFactorTotal, detection.healthScore);

  return {
    ...baseRecord,
    anomalies: detection.anomalies,
    healthScore: detection.healthScore,
    isMediumVoltage: detection.isMediumVoltage,
    voltageUnbalancePct: detection.unbalanceVoltagePct,
    currentUnbalancePct: detection.unbalanceCurrentPct,
    historical12Months: history12,
  };
}

export function getRecordRepresentativeCurrent(rec: AMRRecord): number {
  return Math.max(rec.currentL1 || 0, rec.currentL2 || 0, rec.currentL3 || 0);
}

/**
 * Deduplicate records by IDPEL:
 * "jika dalam tabel pelanggan terdapat id pelanggan yang sama maka diambil satu data yang mempunyai arus terbesar dengan ditambah keterangan jumlah temuan anomali id pelanggan tersebut"
 */
export function deduplicateSameDayCustomerRecords(records: AMRRecord[]): {
  deduplicatedRecords: AMRRecord[];
  removedCount: number;
  removedRecords: AMRRecord[];
} {
  const groups = new Map<string, AMRRecord[]>();

  for (const rec of records) {
    const key = (rec.locationCode || '').trim();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(rec);
  }

  const deduplicatedRecords: AMRRecord[] = [];
  const removedRecords: AMRRecord[] = [];

  for (const [, group] of groups.entries()) {
    if (group.length === 1) {
      group[0].sameIdpelAnomalyCount = group[0].anomalies.length;
      deduplicatedRecords.push(group[0]);
    } else {
      // Hitung total temuan anomali unik pada seluruh record IDPEL ini
      const totalAnomaliesCount = group.reduce((sum, item) => sum + item.anomalies.length, 0);

      // Urutkan grup berdasarkan arus terbesar duluan
      group.sort((a, b) => {
        const curA = getRecordRepresentativeCurrent(a);
        const curB = getRecordRepresentativeCurrent(b);
        if (Math.abs(curB - curA) > 0.0001) {
          return curB - curA; // Terbesar di depan
        }
        if (Math.abs((b.actualPowerKw || 0) - (a.actualPowerKw || 0)) > 0.0001) {
          return (b.actualPowerKw || 0) - (a.actualPowerKw || 0);
        }
        return b.id.localeCompare(a.id);
      });

      // Pertahankan data dengan arus terbesar
      const chosenRecord = {
        ...group[0],
        sameIdpelAnomalyCount: totalAnomaliesCount,
      };

      deduplicatedRecords.push(chosenRecord);

      for (let i = 1; i < group.length; i++) {
        removedRecords.push(group[i]);
      }
    }
  }

  return {
    deduplicatedRecords,
    removedCount: removedRecords.length,
    removedRecords,
  };
}

export interface BatchParseResult {
  allRecords: AMRRecord[];
  summaries: FileValidationSummary[];
  totalValid: number;
  totalInvalid: number;
  warnings: string[];
  dateRange: string[];
}

export async function parseAMRFileWithSummary(file: File): Promise<{ records: AMRRecord[]; summary: FileValidationSummary }> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const fileSizeMb = Math.round((file.size / (1024 * 1024)) * 100) / 100;
  const warnings: string[] = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetsProcessed: string[] = [];
    const allParsedRecords: AMRRecord[] = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
      sheetsProcessed.push(sheetName);
      const worksheet = workbook.Sheets[sheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      totalRows += jsonRows.length;

      jsonRows.forEach((row, idx) => {
        const rec = rawRowToAMRRecord(row, allParsedRecords.length + idx);
        if (rec) allParsedRecords.push(rec);
      });
    }

    const { deduplicatedRecords, removedCount } = deduplicateSameDayCustomerRecords(allParsedRecords);
    if (removedCount > 0) {
      warnings.push(`Ditemukan ${removedCount} data ID Pelanggan ganda. Dipertahankan 1 data berarus terbesar beserta rekap temuan anomalinya.`);
    }

    const detectedUnit = deduplicatedRecords[0]?.unitIndukCode || '52';

    return {
      records: deduplicatedRecords,
      summary: {
        fileName: file.name,
        totalRows,
        validRows: deduplicatedRecords.length,
        invalidRows: removedCount,
        warnings,
        datesFound: Array.from(new Set(deduplicatedRecords.map((r) => r.periode || ''))).filter(Boolean),
        isSuccess: deduplicatedRecords.length > 0,
        sheetsCount: workbook.SheetNames.length,
        sheetsProcessed,
        fileSizeMb,
        unitIndukDetected: detectedUnit,
      },
    };
  } else {
    // CSV parsing with chunk-friendly reading
    const text = await file.text();
    const records = parseCsvContent(text, 100000);
    const detectedUnit = records[0]?.unitIndukCode || '52';

    return {
      records,
      summary: {
        fileName: file.name,
        totalRows: records.length,
        validRows: records.length,
        invalidRows: 0,
        warnings,
        datesFound: Array.from(new Set(records.map((r) => r.periode || ''))).filter(Boolean),
        isSuccess: records.length > 0,
        fileSizeMb,
        unitIndukDetected: detectedUnit,
      },
    };
  }
}

export async function parseAMRFilesBatch(files: File[] | FileList): Promise<BatchParseResult> {
  const fileArray = Array.from(files);
  const rawBatchRecords: AMRRecord[] = [];
  const summaries: FileValidationSummary[] = [];
  const allWarnings: string[] = [];
  const allDates = new Set<string>();

  for (const file of fileArray) {
    const res = await parseAMRFileWithSummary(file);
    summaries.push(res.summary);
    if (res.summary.warnings.length > 0) {
      allWarnings.push(...res.summary.warnings.map((w: string) => `[${file.name}] ${w}`));
    }
    res.summary.datesFound.forEach((d: string) => allDates.add(d));
    rawBatchRecords.push(...res.records);
  }

  const { deduplicatedRecords: allRecords, removedCount: batchRemovedCount } = deduplicateSameDayCustomerRecords(rawBatchRecords);
  if (batchRemovedCount > 0) {
    allWarnings.push(
      `Ditemukan ${batchRemovedCount} record duplikat IDPEL. Record dengan arus tertinggi dipertahankan dan diberi counter temuan anomali.`
    );
  }

  return {
    allRecords,
    summaries,
    totalValid: allRecords.length,
    totalInvalid: summaries.reduce((acc, s) => acc + s.invalidRows, 0) + batchRemovedCount,
    warnings: allWarnings,
    dateRange: Array.from(allDates).sort(),
  };
}

export async function parseAMRFile(file: File): Promise<AMRRecord[]> {
  const result = await parseAMRFileWithSummary(file);
  if (!result.summary.isSuccess && result.summary.error) {
    throw new Error(result.summary.error);
  }
  return result.records;
}

export function parseCsvContent(text: string, maxRows = 50000): AMRRecord[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

  const records: AMRRecord[] = [];
  const limit = Math.min(lines.length, maxRows + 1);

  for (let i = 1; i < limit; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    if (values.length < 5) continue;

    const rowObj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = values[c] !== undefined ? values[c].replace(/^"|"$/g, '').trim() : '';
    }

    const rec = rawRowToAMRRecord(rowObj, i - 1);
    if (rec) {
      records.push(rec);
    }
  }

  const { deduplicatedRecords } = deduplicateSameDayCustomerRecords(records);
  return deduplicatedRecords;
}
