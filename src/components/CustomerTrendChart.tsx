import React, { useState, useMemo } from 'react';
import { AMRRecord } from '../types/amr';
import { parseAmrDateString } from '../utils/amrParser';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  LineChart,
  Zap,
  Download,
  AlertCircle,
  Activity,
  Layers,
  ArrowUpRight,
  Sun,
  Moon,
  Sparkles,
  Gauge,
  Compass,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface CustomerTrendChartProps {
  record: AMRRecord;
  historyRecords?: AMRRecord[];
}


export type PeriodType = 'harian' | 'bulanan' | 'tahunan';
export type MetricType = 'beban' | 'tegangan' | 'cosphi';
export type ChartType = 'area' | 'bar';

interface TrendDataPoint {
  index: number;
  label: string;
  subLabel?: string;
  isSpecialPeriod?: boolean; // WBP atau Weekend
  // Metric values
  value: number; // Primary value shown on Y-axis
  unit: string;
  // Sub-breakdowns
  powerKw?: number;
  powerWatt?: number;
  kwh?: number;
  v1?: number;
  v2?: number;
  v3?: number;
  vAvg?: number;
  pf1?: number;
  pf2?: number;
  pf3?: number;
  pfTotal?: number;
  isRealData?: boolean;
}

export const CustomerTrendChart: React.FC<CustomerTrendChartProps> = ({
  record,
  historyRecords = [],
}) => {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<PeriodType>('harian');
  const [metric, setMetric] = useState<MetricType>('beban');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);


  // Basis parameter pelanggan
  const baseKw = record.actualPowerKw > 0 ? record.actualPowerKw : Math.max(0.5, (record.power * 0.7) / 1000);
  const baseWatt = record.activePowerTotal > 0 ? record.activePowerTotal : (baseKw * 1000) / (record.multiplier || 1);
  const contractKva = record.power >= 1000 ? record.power / 1000 : record.power / 1000;
  const contractKw = +(contractKva * 0.85).toFixed(2);
  const is3Phase = record.phaseType === '3-Phase';
  const isTM = record.isMediumVoltage;
  const nominalV = isTM ? 57.7 : 230.0;
  const vUpperThreshold = isTM ? 61.0 : 241.5; // +5%
  const vLowerThreshold = isTM ? 52.0 : 207.0; // -10%

  // Temukan data riwayat riil jika multi-hari diunggah dari Excel
  const customerHistory = useMemo(() => {
    return historyRecords.filter(
      (hr) => hr.locationCode === record.locationCode || (hr.assetMeterCode && hr.assetMeterCode === record.assetMeterCode)
    );
  }, [historyRecords, record.locationCode, record.assetMeterCode]);

  const hasRealMultiDayData = customerHistory.length > 1;

  // Simple deterministic seed untuk proyeksi stabil yang merefleksikan IDPEL jika data instant tunggal
  const seed = useMemo(() => {
    let s = 0;
    const str = `${record.locationCode}_${record.assetMeterCode || ''}_${record.power}`;
    for (let i = 0; i < str.length; i++) {
      s = (s * 31 + str.charCodeAt(i)) % 100000;
    }
    return s;
  }, [record.locationCode, record.assetMeterCode, record.power]);

  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // 1. DATA TREN HARIAN (24 JAM: 00:00 - 23:00)
  const dailyPoints: TrendDataPoint[] = useMemo(() => {
    const isIndustrial = (record.tariff || '').startsWith('I');
    const isBusiness = (record.tariff || '').startsWith('B');

    // Cek apakah ada rekaman riil per jam di dataset
    const hourMap = new Map<number, AMRRecord>();
    if (customerHistory.length > 0) {
      customerHistory.forEach((r) => {
        const d = parseAmrDateString(r.readDate || r.periode);
        if (!hourMap.has(d.hour)) {
          hourMap.set(d.hour, r);
        }
      });
    }

    return Array.from({ length: 24 }, (_, h) => {
      const isWbp = h >= 17 && h < 22; // WBP: 17.00 - 22.00
      const realRec = hourMap.get(h);

      let pKw = 0;
      let pWatt = 0;
      let v1 = 0;
      let v2 = 0;
      let v3 = 0;
      let vAvg = 0;
      let pf1 = 0;
      let pf2 = 0;
      let pf3 = 0;
      let pfTotal = 0;

      if (realRec) {
        // Menggunakan data riil hasil bacaan
        pKw = realRec.actualPowerKw;
        pWatt = realRec.activePowerTotal;
        v1 = realRec.voltageL1;
        v2 = realRec.voltageL2;
        v3 = realRec.voltageL3;
        vAvg = is3Phase ? +( (v1 + v2 + v3) / 3 ).toFixed(1) : v1;
        pf1 = realRec.powerFactorL1;
        pf2 = realRec.powerFactorL2;
        pf3 = realRec.powerFactorL3;
        pfTotal = realRec.powerFactorTotal;
      } else {
        // Kurva tipikal PLN terkalibrasi ke titik baca aktual
        let loadRatio = 0.5;
        if (isIndustrial) {
          if (h >= 8 && h < 16) loadRatio = 0.95 + pseudoRandom(h) * 0.12;
          else if (isWbp) loadRatio = 0.78 + pseudoRandom(h) * 0.1;
          else loadRatio = 0.62 + pseudoRandom(h) * 0.12;
        } else if (isBusiness) {
          if (h >= 10 && h < 21) loadRatio = 0.92 + pseudoRandom(h) * 0.18;
          else if (h >= 7 && h < 10) loadRatio = 0.6 + pseudoRandom(h) * 0.12;
          else loadRatio = 0.28 + pseudoRandom(h) * 0.1;
        } else {
          if (isWbp) loadRatio = 1.05 + pseudoRandom(h) * 0.15;
          else if (h >= 6 && h <= 8) loadRatio = 0.72 + pseudoRandom(h) * 0.12;
          else if (h >= 9 && h < 17) loadRatio = 0.52 + pseudoRandom(h) * 0.12;
          else loadRatio = 0.38 + pseudoRandom(h) * 0.08;
        }

        pKw = +(baseKw * loadRatio).toFixed(2);
        pWatt = Math.round((pKw * 1000) / (record.multiplier || 1));

        // Tegangan berfluktuasi tipikal (sedikit drop saat jam beban puncak)
        const vDrop = isWbp ? 4.5 * (loadRatio - 0.5) : -2.0 * pseudoRandom(h * 3);
        const baseV1 = record.voltageL1 > 20 ? record.voltageL1 : nominalV;
        const baseV2 = record.voltageL2 > 20 ? record.voltageL2 : (is3Phase ? nominalV : 0);
        const baseV3 = record.voltageL3 > 20 ? record.voltageL3 : (is3Phase ? nominalV : 0);

        v1 = +(baseV1 - vDrop + (pseudoRandom(h) - 0.5) * 3).toFixed(1);
        v2 = is3Phase ? +(baseV2 - vDrop + (pseudoRandom(h + 5) - 0.5) * 3).toFixed(1) : 0;
        v3 = is3Phase ? +(baseV3 - vDrop + (pseudoRandom(h + 9) - 0.5) * 3).toFixed(1) : 0;
        vAvg = is3Phase ? +((v1 + v2 + v3) / 3).toFixed(1) : v1;

        // Cosphi tipikal
        const basePf = record.powerFactorTotal !== 0 ? record.powerFactorTotal : 0.92;
        pfTotal = +(basePf + (pseudoRandom(h * 7) - 0.5) * 0.04).toFixed(3);
        pfTotal = Math.min(0.999, Math.max(0.2, pfTotal));
        pf1 = +(pfTotal + (pseudoRandom(h) - 0.5) * 0.02).toFixed(3);
        pf2 = is3Phase ? +(pfTotal + (pseudoRandom(h + 2) - 0.5) * 0.02).toFixed(3) : 0;
        pf3 = is3Phase ? +(pfTotal + (pseudoRandom(h + 4) - 0.5) * 0.02).toFixed(3) : 0;
      }

      let primaryVal = pKw;
      let unit = 'kW';
      if (metric === 'tegangan') {
        primaryVal = vAvg;
        unit = 'V';
      } else if (metric === 'cosphi') {
        primaryVal = pfTotal;
        unit = '';
      }

      return {
        index: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        subLabel: isWbp ? 'WBP' : 'LWBP',
        isSpecialPeriod: isWbp,
        value: primaryVal,
        unit,
        powerKw: pKw,
        powerWatt: pWatt,
        kwh: +pKw.toFixed(2),
        v1,
        v2,
        v3,
        vAvg,
        pf1,
        pf2,
        pf3,
        pfTotal,
        isRealData: !!realRec,
      };
    });
  }, [baseKw, record, customerHistory, is3Phase, isTM, nominalV, metric, seed]);

  // 2. DATA TREN BULANAN (31 HARI)
  const monthlyPoints: TrendDataPoint[] = useMemo(() => {
    // Kelompokkan data riil per hari jika ada
    const dayMap = new Map<number, AMRRecord>();
    if (customerHistory.length > 0) {
      customerHistory.forEach((r) => {
        const d = parseAmrDateString(r.readDate || r.periode);
        if (!dayMap.has(d.day)) {
          dayMap.set(d.day, r);
        }
      });
    }

    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const dayOfWeek = (day + 2) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const realRec = dayMap.get(day);

      let pKw = 0;
      let pWatt = 0;
      let kwh = 0;
      let v1 = 0;
      let v2 = 0;
      let v3 = 0;
      let vAvg = 0;
      let pf1 = 0;
      let pf2 = 0;
      let pf3 = 0;
      let pfTotal = 0;

      if (realRec) {
        pKw = realRec.actualPowerKw;
        pWatt = realRec.activePowerTotal;
        kwh = Math.round(pKw * 24 * 0.7);
        v1 = realRec.voltageL1;
        v2 = realRec.voltageL2;
        v3 = realRec.voltageL3;
        vAvg = is3Phase ? +((v1 + v2 + v3) / 3).toFixed(1) : v1;
        pf1 = realRec.powerFactorL1;
        pf2 = realRec.powerFactorL2;
        pf3 = realRec.powerFactorL3;
        pfTotal = realRec.powerFactorTotal;
      } else {
        const factor = isWeekend ? 0.72 + pseudoRandom(day * 7) * 0.15 : 0.9 + pseudoRandom(day * 7) * 0.22;
        pKw = +(baseKw * (factor + 0.15)).toFixed(2);
        pWatt = Math.round((pKw * 1000) / (record.multiplier || 1));
        kwh = Math.round(baseKw * factor * 24);

        const baseV1 = record.voltageL1 > 20 ? record.voltageL1 : nominalV;
        const baseV2 = record.voltageL2 > 20 ? record.voltageL2 : (is3Phase ? nominalV : 0);
        const baseV3 = record.voltageL3 > 20 ? record.voltageL3 : (is3Phase ? nominalV : 0);

        v1 = +(baseV1 + (pseudoRandom(day * 2) - 0.5) * 4).toFixed(1);
        v2 = is3Phase ? +(baseV2 + (pseudoRandom(day * 2 + 1) - 0.5) * 4).toFixed(1) : 0;
        v3 = is3Phase ? +(baseV3 + (pseudoRandom(day * 2 + 2) - 0.5) * 4).toFixed(1) : 0;
        vAvg = is3Phase ? +((v1 + v2 + v3) / 3).toFixed(1) : v1;

        const basePf = record.powerFactorTotal !== 0 ? record.powerFactorTotal : 0.92;
        pfTotal = +(basePf + (pseudoRandom(day * 5) - 0.5) * 0.03).toFixed(3);
        pfTotal = Math.min(0.999, Math.max(0.2, pfTotal));
        pf1 = +(pfTotal + (pseudoRandom(day) - 0.5) * 0.02).toFixed(3);
        pf2 = is3Phase ? +(pfTotal + (pseudoRandom(day + 2) - 0.5) * 0.02).toFixed(3) : 0;
        pf3 = is3Phase ? +(pfTotal + (pseudoRandom(day + 4) - 0.5) * 0.02).toFixed(3) : 0;
      }

      let primaryVal = pKw;
      let unit = 'kW';
      if (metric === 'tegangan') {
        primaryVal = vAvg;
        unit = 'V';
      } else if (metric === 'cosphi') {
        primaryVal = pfTotal;
        unit = '';
      }

      return {
        index: i,
        label: `Tgl ${day}`,
        subLabel: isWeekend ? 'Libur' : 'Kerja',
        isSpecialPeriod: isWeekend,
        value: primaryVal,
        unit,
        powerKw: pKw,
        powerWatt: pWatt,
        kwh,
        v1,
        v2,
        v3,
        vAvg,
        pf1,
        pf2,
        pf3,
        pfTotal,
        isRealData: !!realRec,
      };
    });
  }, [baseKw, record, customerHistory, is3Phase, nominalV, metric, seed]);

  // 3. DATA TREN TAHUNAN (12 BULAN)
  const yearlyPoints: TrendDataPoint[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const monthMap = new Map<number, AMRRecord>();
    if (customerHistory.length > 0) {
      customerHistory.forEach((r) => {
        const d = parseAmrDateString(r.readDate || r.periode);
        if (!monthMap.has(d.month)) {
          monthMap.set(d.month, r);
        }
      });
    }

    return months.map((monthName, idx) => {
      const monthNum = idx + 1;
      const realRec = monthMap.get(monthNum);

      let pKw = 0;
      let pWatt = 0;
      let kwh = 0;
      let v1 = 0;
      let v2 = 0;
      let v3 = 0;
      let vAvg = 0;
      let pf1 = 0;
      let pf2 = 0;
      let pf3 = 0;
      let pfTotal = 0;

      if (realRec) {
        pKw = realRec.actualPowerKw;
        pWatt = realRec.activePowerTotal;
        kwh = Math.round(pKw * 720 * 0.72);
        v1 = realRec.voltageL1;
        v2 = realRec.voltageL2;
        v3 = realRec.voltageL3;
        vAvg = is3Phase ? +((v1 + v2 + v3) / 3).toFixed(1) : v1;
        pf1 = realRec.powerFactorL1;
        pf2 = realRec.powerFactorL2;
        pf3 = realRec.powerFactorL3;
        pfTotal = realRec.powerFactorTotal;
      } else {
        const seasonal = 0.88 + Math.sin((idx / 12) * Math.PI) * 0.22 + pseudoRandom(idx * 13) * 0.1;
        pKw = +(baseKw * (seasonal + 0.12)).toFixed(2);
        pWatt = Math.round((pKw * 1000) / (record.multiplier || 1));
        kwh = Math.round(baseKw * seasonal * 720);

        const baseV1 = record.voltageL1 > 20 ? record.voltageL1 : nominalV;
        const baseV2 = record.voltageL2 > 20 ? record.voltageL2 : (is3Phase ? nominalV : 0);
        const baseV3 = record.voltageL3 > 20 ? record.voltageL3 : (is3Phase ? nominalV : 0);

        v1 = +(baseV1 + (pseudoRandom(idx * 3) - 0.5) * 3).toFixed(1);
        v2 = is3Phase ? +(baseV2 + (pseudoRandom(idx * 3 + 1) - 0.5) * 3).toFixed(1) : 0;
        v3 = is3Phase ? +(baseV3 + (pseudoRandom(idx * 3 + 2) - 0.5) * 3).toFixed(1) : 0;
        vAvg = is3Phase ? +((v1 + v2 + v3) / 3).toFixed(1) : v1;

        const basePf = record.powerFactorTotal !== 0 ? record.powerFactorTotal : 0.92;
        pfTotal = +(basePf + (pseudoRandom(idx * 4) - 0.5) * 0.02).toFixed(3);
        pfTotal = Math.min(0.999, Math.max(0.2, pfTotal));
        pf1 = +(pfTotal + (pseudoRandom(idx) - 0.5) * 0.01).toFixed(3);
        pf2 = is3Phase ? +(pfTotal + (pseudoRandom(idx + 1) - 0.5) * 0.01).toFixed(3) : 0;
        pf3 = is3Phase ? +(pfTotal + (pseudoRandom(idx + 2) - 0.5) * 0.01).toFixed(3) : 0;
      }

      let primaryVal = pKw;
      let unit = 'kW';
      if (metric === 'tegangan') {
        primaryVal = vAvg;
        unit = 'V';
      } else if (metric === 'cosphi') {
        primaryVal = pfTotal;
        unit = '';
      }

      return {
        index: idx,
        label: monthName,
        subLabel: `Bulan ${monthNum}`,
        isSpecialPeriod: idx >= 5 && idx <= 8, // Musim kemarau/peak AC
        value: primaryVal,
        unit,
        powerKw: pKw,
        powerWatt: pWatt,
        kwh,
        v1,
        v2,
        v3,
        vAvg,
        pf1,
        pf2,
        pf3,
        pfTotal,
        isRealData: !!realRec,
      };
    });
  }, [baseKw, record, customerHistory, is3Phase, nominalV, metric, seed]);

  // Titik aktif berdasarkan periode terpilih
  const activePoints = useMemo(() => {
    if (period === 'harian') return dailyPoints;
    if (period === 'bulanan') return monthlyPoints;
    return yearlyPoints;
  }, [period, dailyPoints, monthlyPoints, yearlyPoints]);

  // Statistik Ringkas Metrik Aktif
  const stats = useMemo(() => {
    const vals = activePoints.map((p) => p.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const avgVal = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(metric === 'cosphi' ? 3 : 2);
    const totalKwh = activePoints.reduce((a, b) => a + (b.kwh || 0), 0);

    const peakPoint = activePoints.find((p) => p.value === maxVal);
    const peakLabel = peakPoint ? peakPoint.label : '-';

    return { minVal, maxVal, avgVal, totalKwh, peakLabel };
  }, [activePoints, metric]);

  // Ekspor Data Tren ke CSV
  const handleExportCsv = () => {
    let header = '';
    let rows: string[] = [];
    const filename = `AMR_Tren_${record.locationCode}_${metric}_${period}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (metric === 'beban') {
      header = 'Periode/Waktu,Status,Pemakaian Aktual (kW),Daya Register Meter (Watt),Energi (kWh),Faktor Kali\n';
      rows = activePoints.map(
        (p) =>
          `"${p.label}","${p.subLabel || ''}",${p.powerKw},${p.powerWatt},${p.kwh},${record.multiplier}`
      );
    } else if (metric === 'tegangan') {
      header = 'Periode/Waktu,Status,VR (V),VS (V),VT (V),V Rata-Rata (V),Standar SPLN Nominal\n';
      rows = activePoints.map(
        (p) =>
          `"${p.label}","${p.subLabel || ''}",${p.v1},${p.v2},${p.v3},${p.vAvg},${nominalV}`
      );
    } else {
      header = 'Periode/Waktu,Status,Cos φ Total,Cos φ R,Cos φ S,Cos φ T,Batas Denda kVARh\n';
      rows = activePoints.map(
        (p) =>
          `"${p.label}","${p.subLabel || ''}",${p.pfTotal},${p.pf1},${p.pf2},${p.pf3},0.85`
      );
    }

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Dimensions & Bounds Calculation
  const chartHeight = 230;
  const chartWidth = 740;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const yBounds = useMemo(() => {
    if (metric === 'beban') {
      const top = Math.max(stats.maxVal * 1.2, contractKw * 1.05, 5);
      return { min: 0, max: top };
    } else if (metric === 'tegangan') {
      const base = isTM ? 57.7 : 230;
      const minV = Math.min(stats.minVal, base * 0.85);
      const maxV = Math.max(stats.maxVal, base * 1.15);
      return { min: Math.floor(minV / 10) * 10, max: Math.ceil(maxV / 10) * 10 };
    } else {
      // Cosphi
      return { min: Math.min(0, Math.floor(stats.minVal * 10) / 10), max: 1.0 };
    }
  }, [metric, stats.maxVal, stats.minVal, contractKw, isTM]);

  const getYPos = (val: number) => {
    const range = yBounds.max - yBounds.min || 1;
    const clamped = Math.min(yBounds.max, Math.max(yBounds.min, val));
    return padTop + plotH - ((clamped - yBounds.min) / range) * plotH;
  };

  const getXPos = (idx: number, total: number) => {
    if (total <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (total - 1)) * plotW;
  };

  // Path SVG Generator
  const areaPath = useMemo(() => {
    const total = activePoints.length;
    if (total === 0) return '';
    const firstX = getXPos(0, total);
    const firstY = getYPos(activePoints[0].value);
    let d = `M ${firstX} ${firstY}`;

    for (let i = 1; i < total; i++) {
      const x = getXPos(i, total);
      const y = getYPos(activePoints[i].value);
      const prevX = getXPos(i - 1, total);
      const prevY = getYPos(activePoints[i - 1].value);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      d += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }

    const baselineY = getYPos(yBounds.min);
    const lastX = getXPos(total - 1, total);
    const closed = `${d} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return { line: d, area: closed };
  }, [activePoints, yBounds]);

  // Warna dan Tema Berdasarkan Metrik
  const metricTheme = useMemo(() => {
    if (metric === 'beban') {
      return {
        title: 'Tren Beban Pemakaian Listrik',
        unitLabel: 'kW',
        color: '#10b981',
        gradientStart: '#10b981',
        gradientEnd: '#064e3b',
        subText: 'Pemakaian Daya Primer (kW = Watt/1.000 × FK)',
      };
    } else if (metric === 'tegangan') {
      return {
        title: 'Tren Tegangan Fasa',
        unitLabel: 'Volt (V)',
        color: '#06b6d4',
        gradientStart: '#06b6d4',
        gradientEnd: '#083344',
        subText: isTM ? 'Tegangan Menengah Sekunder PT (Nominal ~57.7V)' : 'Tegangan Rendah Fasa-Netral (Nominal 230V)',
      };
    } else {
      return {
        title: 'Tren Faktor Daya (Cos φ)',
        unitLabel: 'Cos φ',
        color: stats.avgVal < 0.85 ? '#f59e0b' : '#10b981',
        gradientStart: stats.avgVal < 0.85 ? '#f59e0b' : '#10b981',
        gradientEnd: stats.avgVal < 0.85 ? '#451a03' : '#064e3b',
        subText: 'Standar Regulasi SPLN: Cos φ ≥ 0.85 (Bebas Denda kVARh)',
      };
    }
  }, [metric, stats.avgVal, isTM]);

  return (
    <div
      className={`rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 border transition-colors ${
        isDark
          ? 'bg-slate-900/95 border-emerald-500/30 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      {/* HEADER SECTION: Title & Navigasi Metrik & Periode */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}
            >
              {metric === 'beban' && <TrendingUp className="w-5 h-5" />}
              {metric === 'tegangan' && <Zap className="w-5 h-5 text-cyan-500" />}
              {metric === 'cosphi' && <Compass className="w-5 h-5 text-amber-500" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>{metricTheme.title}:</span>{' '}
                  <span className={isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                    {record.namaPelanggan}
                  </span>
                </h3>
                {hasRealMultiDayData ? (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Data Riil Multi-Hari ({customerHistory.length} Record)
                  </span>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    Instant Meter Snapshot + Proyeksi Beban
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                IDPEL: <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{record.locationCode}</strong> • Tarif:{' '}
                <strong className={isDark ? 'text-cyan-300' : 'text-emerald-700'}>{record.tariff}</strong> • Daya Kontrak:{' '}
                <strong className={isDark ? 'text-emerald-300' : 'text-teal-700'}>
                  {record.power >= 1000 ? `${(record.power / 1000).toLocaleString('id-ID')} kVA` : `${record.power} VA`}
                </strong>{' '}
                • Fasa: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{record.phaseType}</strong> • FK:{' '}
                <strong className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{record.multiplier}×</strong>
              </p>
            </div>
          </div>
        </div>

        {/* CLUSTER KONTROL: Metrik, Periode, Tipe Chart, Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SWITCHER 1: METRIK (Beban kW / Tegangan V / Cosphi) */}
          <div
            className={`flex p-1 rounded-xl border text-xs shadow-inner ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => {
                setMetric('beban');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metric === 'beban'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Beban (kW)</span>
            </button>

            <button
              onClick={() => {
                setMetric('tegangan');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metric === 'tegangan'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tegangan (V)</span>
            </button>

            <button
              onClick={() => {
                setMetric('cosphi');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metric === 'cosphi'
                  ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Faktor Daya (Cos φ)</span>
            </button>
          </div>

          {/* SWITCHER 2: PERIODE (Harian 24 Jam / Bulanan 31 Hari / Tahunan 12 Bulan) */}
          <div
            className={`flex p-1 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => {
                setPeriod('harian');
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                period === 'harian'
                  ? isDark
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-white text-emerald-800 border border-slate-300 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Harian</span>
            </button>

            <button
              onClick={() => {
                setPeriod('bulanan');
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                period === 'bulanan'
                  ? isDark
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-white text-emerald-800 border border-slate-300 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bulanan</span>
            </button>

            <button
              onClick={() => {
                setPeriod('tahunan');
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                period === 'tahunan'
                  ? isDark
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-white text-emerald-800 border border-slate-300 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tahunan</span>
            </button>
          </div>

          {/* TOGGLE TAMPILAN: Area vs Bar */}
          <div
            className={`flex p-1 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'area'
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Kurva Luasan"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'bar'
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Batang (Bar)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* UNDUH CSV */}
          <button
            onClick={handleExportCsv}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Ekspor CSV Hasil Tren"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* METRIC INFO STRIP */}
      <div
        className={`p-3 border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border-slate-800'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
              isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}
          >
            {metric === 'beban' ? 'kW' : metric === 'tegangan' ? 'V' : 'φ'}
          </div>
          <div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{metricTheme.title}: </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{metricTheme.subText}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          {metric === 'beban' && (
            <>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Daya Kontrak:</span>{' '}
                <strong className={isDark ? 'text-cyan-300' : 'text-emerald-700'}>{contractKw} kW</strong>
              </div>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Faktor Kali:</span>{' '}
                <strong className={isDark ? 'text-emerald-400' : 'text-teal-700'}>{record.multiplier}×</strong>
              </div>
              <div className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                WBP: <span className="font-sans font-bold">17.00 - 22.00</span>
              </div>
            </>
          )}

          {metric === 'tegangan' && (
            <>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Nominal:</span>{' '}
                <strong className={isDark ? 'text-cyan-300' : 'text-emerald-700'}>{nominalV} V</strong>
              </div>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Batas Toleransi SPLN:</span>{' '}
                <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>{vLowerThreshold} V (-10%) s/d {vUpperThreshold} V (+5%)</strong>
              </div>
            </>
          )}

          {metric === 'cosphi' && (
            <>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Batas Kritis SPLN:</span>{' '}
                <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>0.85</strong>
              </div>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>{' '}
                <strong className={stats.avgVal < 0.85 ? 'text-amber-500 font-bold' : isDark ? 'text-emerald-400' : 'text-emerald-600 font-bold'}>
                  {stats.avgVal < 0.85 ? 'Kena Denda kVARh' : 'Bebas Denda kVARh'}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CARD 1: Nilai Puncak / Tertinggi */}
        <div className={`border rounded-xl p-3 transition-colors ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{metric === 'beban' ? 'Beban Puncak' : metric === 'tegangan' ? 'Tegangan Tertinggi' : 'Cos φ Tertinggi'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {stats.maxVal} <span className="text-xs text-slate-500">{metric === 'beban' ? 'kW' : metric === 'tegangan' ? 'V' : ''}</span>
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Puncak pada: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{stats.peakLabel}</strong>
          </div>
        </div>

        {/* CARD 2: Nilai Rata-rata */}
        <div className={`border rounded-xl p-3 transition-colors ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Rata-Rata {period === 'harian' ? '24 Jam' : period === 'bulanan' ? '31 Hari' : '12 Bulan'}</span>
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-1">
            {stats.avgVal} <span className="text-xs text-slate-500">{metric === 'beban' ? 'kW' : metric === 'tegangan' ? 'V' : ''}</span>
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {metric === 'beban' ? 'Beban stabil pelanggan' : metric === 'tegangan' ? 'Tegangan rata-rata' : 'Rata-rata faktor daya'}
          </div>
        </div>

        {/* CARD 3: Nilai Terendah */}
        <div className={`border rounded-xl p-3 transition-colors ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{metric === 'beban' ? 'Beban Terendah' : metric === 'tegangan' ? 'Tegangan Terendah' : 'Cos φ Terendah'}</span>
            <Gauge className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-300 font-mono mt-1">
            {stats.minVal} <span className="text-xs text-slate-500">{metric === 'beban' ? 'kW' : metric === 'tegangan' ? 'V' : ''}</span>
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {metric === 'beban'
              ? 'Beban dasar (baseload)'
              : metric === 'tegangan'
              ? stats.minVal < vLowerThreshold ? '⚠️ Drop Tegangan' : 'Stabil'
              : stats.minVal < 0.85 ? '⚠️ Potensi Denda' : 'Memenuhi SPLN'}
          </div>
        </div>

        {/* CARD 4: Akumulasi Energi / Load Factor / Kepatuhan */}
        <div className={`border rounded-xl p-3 transition-colors ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{metric === 'beban' ? 'Total Energi' : metric === 'tegangan' ? 'Stabilitas Tegangan' : 'Kepatuhan Cos φ'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          {metric === 'beban' ? (
            <>
              <div className="text-xl font-extrabold text-amber-500 font-mono mt-1">
                {stats.totalKwh.toLocaleString('id-ID')} <span className="text-xs text-slate-500">kWh</span>
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                LF: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{Math.min(100, Math.round((stats.avgVal / (stats.maxVal || 1)) * 100))}%</strong>
              </div>
            </>
          ) : metric === 'tegangan' ? (
            <>
              <div className="text-xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono mt-1">
                {stats.minVal >= vLowerThreshold && stats.maxVal <= vUpperThreshold ? '100% SPLN' : 'Deviasi'}
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Rentang: {stats.minVal}V - {stats.maxVal}V
              </div>
            </>
          ) : (
            <>
              <div className={`text-xl font-extrabold font-mono mt-1 ${stats.minVal < 0.85 ? 'text-amber-500' : 'text-emerald-600'}`}>
                {stats.minVal < 0.85 ? 'Kena Denda' : 'Bebas Denda'}
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Batas denda: <strong className={isDark ? 'text-white' : 'text-slate-900'}>Cos φ &lt; 0.85</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* GRAFIK SVG UTAMA */}
      <div className={`border rounded-xl p-4 relative transition-colors ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: metricTheme.color }}
            ></span>
            <span>
              {period === 'harian' && `Profil 24 Jam: ${metricTheme.title}`}
              {period === 'bulanan' && `Tren 31 Hari: ${metricTheme.title}`}
              {period === 'tahunan' && `Tren 12 Bulan Kalender: ${metricTheme.title}`}
            </span>
          </span>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sumbu Y: {metricTheme.unitLabel} | Min: {yBounds.min} - Max: {yBounds.max}
          </span>
        </div>

        {/* Responsive SVG Canvas */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[620px] select-none"
          >
            <defs>
              <linearGradient id="areaGradientTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metricTheme.gradientStart} stopOpacity="0.5" />
                <stop offset="70%" stopColor={metricTheme.gradientEnd} stopOpacity="0.1" />
                <stop offset="100%" stopColor={metricTheme.gradientEnd} stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="barGradientTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metricTheme.gradientStart} stopOpacity="0.9" />
                <stop offset="100%" stopColor={metricTheme.gradientEnd} stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Grid Lines Horisontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const yVal = yBounds.min + (yBounds.max - yBounds.min) * pct;
              const yPos = getYPos(yVal);
              return (
                <g key={pct}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={chartWidth - padRight}
                    y2={yPos}
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fill={isDark ? '#64748b' : '#64748b'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {metric === 'cosphi' ? yVal.toFixed(2) : Math.round(yVal)}
                  </text>
                </g>
              );
            })}


            {/* Threshold Line: Cosphi 0.85 (Batas Denda) */}
            {metric === 'cosphi' && (
              <g>
                <line
                  x1={padLeft}
                  y1={getYPos(0.85)}
                  x2={chartWidth - padRight}
                  y2={getYPos(0.85)}
                  stroke="#f59e0b"
                  strokeDasharray="4 2"
                  strokeWidth="1.5"
                />
                <text
                  x={chartWidth - padRight - 5}
                  y={getYPos(0.85) - 5}
                  textAnchor="end"
                  fill="#f59e0b"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Batas Denda kVARh (0.85)
                </text>
              </g>
            )}

            {/* Threshold Line: Tegangan Nominal 230V / 57.7V */}
            {metric === 'tegangan' && (
              <g>
                <line
                  x1={padLeft}
                  y1={getYPos(nominalV)}
                  x2={chartWidth - padRight}
                  y2={getYPos(nominalV)}
                  stroke="#06b6d4"
                  strokeDasharray="4 2"
                  strokeWidth="1.5"
                />
                <text
                  x={chartWidth - padRight - 5}
                  y={getYPos(nominalV) - 5}
                  textAnchor="end"
                  fill="#06b6d4"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Nominal {nominalV}V
                </text>
              </g>
            )}

            {/* Threshold Line: Daya Kontrak (Beban kW) */}
            {metric === 'beban' && contractKw > 0 && contractKw <= yBounds.max && (
              <g>
                <line
                  x1={padLeft}
                  y1={getYPos(contractKw)}
                  x2={chartWidth - padRight}
                  y2={getYPos(contractKw)}
                  stroke="#ef4444"
                  strokeDasharray="4 2"
                  strokeWidth="1.5"
                />
                <text
                  x={chartWidth - padRight - 5}
                  y={getYPos(contractKw) - 5}
                  textAnchor="end"
                  fill="#ef4444"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Daya Kontrak ({contractKw} kW)
                </text>
              </g>
            )}

            {/* Area or Bar Chart Rendering */}
            {chartType === 'area' ? (
              <>
                {/* Area Gradient */}
                {areaPath && (
                  <path d={areaPath.area} fill="url(#areaGradientTrend)" />
                )}

                {/* Line Path */}
                {areaPath && (
                  <path
                    d={areaPath.line}
                    fill="none"
                    stroke={metricTheme.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {activePoints.map((p, idx) => {
                  const cx = getXPos(idx, activePoints.length);
                  const cy = getYPos(p.value);
                  const isHovered = hoveredIdx === idx;
                  return (
                    <g key={idx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : p.isRealData ? 4.5 : 3}
                        fill={p.isRealData ? '#10b981' : metricTheme.color}
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                      />
                      {p.isRealData && !isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="7"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                      )}
                    </g>
                  );
                })}
              </>
            ) : (
              /* Bar Chart */
              activePoints.map((p, idx) => {
                const total = activePoints.length;
                const slotW = plotW / total;
                const barW = Math.max(4, slotW * 0.65);
                const x = padLeft + idx * slotW + (slotW - barW) / 2;
                const y = getYPos(p.value);
                const baselineY = getYPos(yBounds.min);
                const h = Math.max(2, baselineY - y);
                const isHovered = hoveredIdx === idx;

                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="3"
                    fill={isHovered ? '#38bdf8' : p.isRealData ? '#10b981' : 'url(#barGradientTrend)'}
                    className="cursor-pointer transition-all hover:opacity-90"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  />
                );
              })
            )}

            {/* X-Axis Labels */}
            {activePoints.map((p, idx) => {
              // Sederhanakan label jika terlalu banyak titik
              const total = activePoints.length;
              const step = total > 20 ? 3 : 1;
              if (idx % step !== 0 && idx !== total - 1) return null;

              const x = getXPos(idx, total);
              return (
                <text
                  key={idx}
                  x={x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* INTERACTIVE FLOATING TOOLTIP */}
        {hoveredIdx !== null && activePoints[hoveredIdx] && (
          <div className="mt-3 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <div>
                <span className="text-slate-400 text-[11px]">Waktu:</span>{' '}
                <strong className="text-white font-mono text-sm">{activePoints[hoveredIdx].label}</strong>{' '}
                {activePoints[hoveredIdx].subLabel && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                    {activePoints[hoveredIdx].subLabel}
                  </span>
                )}
                {activePoints[hoveredIdx].isRealData && (
                  <span className="ml-1 text-[10px] text-emerald-400 font-bold">● Data Riil Excel</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
              <div>
                <span className="text-slate-400 font-sans">Beban Aktual:</span>{' '}
                <strong className="text-emerald-400">{activePoints[hoveredIdx].powerKw} kW</strong>
              </div>
              <div>
                <span className="text-slate-400 font-sans">Daya Meter:</span>{' '}
                <strong className="text-white">{activePoints[hoveredIdx].powerWatt?.toLocaleString('id-ID')} W</strong>
              </div>
              <div>
                <span className="text-slate-400 font-sans">Tegangan R/S/T:</span>{' '}
                <strong className="text-cyan-300">
                  {activePoints[hoveredIdx].v1}
                  {is3Phase && ` / ${activePoints[hoveredIdx].v2} / ${activePoints[hoveredIdx].v3}`} V
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-sans">Cos φ:</span>{' '}
                <strong
                  className={
                    (activePoints[hoveredIdx].pfTotal || 0) < 0.85 ? 'text-amber-400' : 'text-emerald-400'
                  }
                >
                  {activePoints[hoveredIdx].pfTotal}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
