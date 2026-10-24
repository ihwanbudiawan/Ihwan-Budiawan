import React, { useState, useMemo } from 'react';
import { AMRRecord } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import { PhasorDiagram } from './PhasorDiagram';
import { ConsumptionCharts } from './ConsumptionCharts';
import { printBeritaAcaraP2TL } from '../utils/reportExporter';
import {
  X,
  RotateCw,
  TrendingUp,
  BarChart2,
  Columns,
  Search,
  Printer,
  Calendar,
  Activity,
  Zap,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Info
} from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AMRRecord;
  allRecords: AMRRecord[];
  onSelectRecord?: (record: AMRRecord) => void;
  initialTab?: 'phasor' | 'trend' | 'profile';
  initialSplitMode?: boolean;
}

export type TimeRangeType = 'harian' | 'bulanan' | 'tahunan' | 'custom';
export type TrendMetricCategory = 'energy' | 'voltage' | 'current' | 'cosphi';

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  record: initialRecord,
  allRecords,
  onSelectRecord,
  initialTab = 'phasor',
  initialSplitMode = false,
}) => {
  const { isDark } = useTheme();

  // Active customer state
  const [currentRecord, setCurrentRecord] = useState<AMRRecord>(initialRecord);
  const [activeTab, setActiveTab] = useState<'phasor' | 'trend' | 'profile'>(initialTab);

  // Split-screen state
  const [isSplitMode, setIsSplitMode] = useState<boolean>(initialSplitMode);
  const [compareRecord, setCompareRecord] = useState<AMRRecord | null>(() => {
    // Default comparator: pick a normal customer if current is anomalous, or next record
    const normal = allRecords.find((r) => r.id !== initialRecord.id && r.anomalies.length === 0);
    return normal || allRecords.find((r) => r.id !== initialRecord.id) || null;
  });

  // Manual IDPEL search input
  const [searchQuery, setSearchQuery] = useState('');
  const [compareSearchQuery, setCompareSearchQuery] = useState('');

  // Trend tab states
  const [timeRange, setTimeRange] = useState<TimeRangeType>('harian');
  const [trendMetric, setTrendMetric] = useState<TrendMetricCategory>('energy');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-15');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Sync when prop changes
  React.useEffect(() => {
    setCurrentRecord(initialRecord);
  }, [initialRecord]);

  // Autocomplete / Filtered suggestions for main customer search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allRecords
      .filter(
        (r) =>
          r.locationCode.toLowerCase().includes(q) ||
          r.namaPelanggan.toLowerCase().includes(q) ||
          (r.assetMeterCode && r.assetMeterCode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, allRecords]);

  // Autocomplete suggestions for split-screen compare customer
  const compareSearchResults = useMemo(() => {
    if (!compareSearchQuery.trim()) return [];
    const q = compareSearchQuery.toLowerCase().trim();
    return allRecords
      .filter(
        (r) =>
          r.id !== currentRecord.id &&
          (r.locationCode.toLowerCase().includes(q) ||
            r.namaPelanggan.toLowerCase().includes(q) ||
            (r.assetMeterCode && r.assetMeterCode.toLowerCase().includes(q)))
      )
      .slice(0, 8);
  }, [compareSearchQuery, allRecords, currentRecord]);

  if (!isOpen) return null;

  const handleSelectCustomer = (rec: AMRRecord) => {
    setCurrentRecord(rec);
    if (onSelectRecord) onSelectRecord(rec);
    setSearchQuery('');
  };

  const handleSelectCompareCustomer = (rec: AMRRecord) => {
    setCompareRecord(rec);
    setCompareSearchQuery('');
  };

  // Trend Data Generation based on Time Range & Customer
  const trendPoints = (() => {
    const isIndustrial = (currentRecord.tariff || '').startsWith('I');
    const baseKw = currentRecord.actualPowerKw || Math.max(1, (currentRecord.power * 0.7) / 1000);
    const vNom = currentRecord.isMediumVoltage ? 57.7 : 230;

    if (timeRange === 'harian') {
      // 24 Jam
      return Array.from({ length: 24 }, (_, h) => {
        const isWbp = h >= 17 && h < 22;
        const factor = isWbp ? 1.25 : h < 6 ? 0.35 : 0.85;
        const seedVal = Math.sin(Number(currentRecord.locationCode.slice(-3) || '1') + h);
        const noise = (seedVal - Math.floor(seedVal)) * 0.15;

        const kw = +(baseKw * (factor + noise)).toFixed(2);
        const kvarh = +(kw * (1 - Math.abs(currentRecord.powerFactorTotal)) * 1.2).toFixed(2);
        const vr = +(currentRecord.voltageL1 + (noise - 0.07) * 4).toFixed(1);
        const vs = +(currentRecord.voltageL2 + (noise - 0.05) * 4).toFixed(1);
        const vt = +(currentRecord.voltageL3 + (noise - 0.08) * 4).toFixed(1);
        const vAvg = +((vr + vs + vt) / 3).toFixed(1);

        const ir = +(currentRecord.currentL1 * (factor + noise)).toFixed(2);
        const is_ = +(currentRecord.currentL2 * (factor + noise)).toFixed(2);
        const it = +(currentRecord.currentL3 * (factor + noise)).toFixed(2);
        const in_ = +(Math.abs(ir - is_) * 0.25).toFixed(2);
        const iTotal = +(ir + is_ + it).toFixed(2);

        const pfR = +(currentRecord.powerFactorL1).toFixed(3);
        const pfS = +(currentRecord.powerFactorL2).toFixed(3);
        const pfT = +(currentRecord.powerFactorL3).toFixed(3);
        const pfTotal = +(currentRecord.powerFactorTotal).toFixed(3);

        return {
          label: `${h.toString().padStart(2, '0')}:00`,
          subLabel: isWbp ? 'WBP' : 'LWBP',
          kw,
          kwh: +(kw * 1).toFixed(2),
          kvarh,
          vr,
          vs,
          vt,
          vAvg,
          ir,
          is: is_,
          it,
          in: in_,
          iTotal,
          pfR,
          pfS,
          pfT,
          pfTotal,
        };
      });
    }

    if (timeRange === 'bulanan') {
      // 30 Hari
      return Array.from({ length: 30 }, (_, d) => {
        const day = d + 1;
        const isWeekend = day % 7 === 0 || day % 7 === 6;
        const factor = isWeekend ? 0.65 : 1.0;
        const seedVal = Math.sin(Number(currentRecord.locationCode.slice(-3) || '1') + day);
        const noise = (seedVal - Math.floor(seedVal)) * 0.2;

        const dailyKwh = +(baseKw * 14 * (factor + noise)).toFixed(1);
        const dailyKvarh = +(dailyKwh * 0.45).toFixed(1);
        const vr = +(currentRecord.voltageL1 + (noise - 0.1) * 3).toFixed(1);
        const vs = +(currentRecord.voltageL2 + (noise - 0.08) * 3).toFixed(1);
        const vt = +(currentRecord.voltageL3 + (noise - 0.1) * 3).toFixed(1);
        const vAvg = +((vr + vs + vt) / 3).toFixed(1);

        const ir = +(currentRecord.currentL1 * (factor + noise)).toFixed(2);
        const is_ = +(currentRecord.currentL2 * (factor + noise)).toFixed(2);
        const it = +(currentRecord.currentL3 * (factor + noise)).toFixed(2);
        const in_ = +(Math.abs(ir - is_) * 0.2).toFixed(2);
        const iTotal = +(ir + is_ + it).toFixed(2);

        return {
          label: `Tgl ${day}`,
          subLabel: isWeekend ? 'Libur' : 'Kerja',
          kw: +(baseKw * (factor + noise)).toFixed(2),
          kwh: dailyKwh,
          kvarh: dailyKvarh,
          vr,
          vs,
          vt,
          vAvg,
          ir,
          is: is_,
          it,
          in: in_,
          iTotal,
          pfR: currentRecord.powerFactorL1,
          pfS: currentRecord.powerFactorL2,
          pfT: currentRecord.powerFactorL3,
          pfTotal: currentRecord.powerFactorTotal,
        };
      });
    }

    if (timeRange === 'tahunan') {
      // 12 Bulan
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return months.map((m, i) => {
        const factor = 0.9 + Math.sin(i) * 0.15;
        const monthlyKwh = +(baseKw * 380 * factor).toFixed(0);
        const monthlyKvarh = +(monthlyKwh * 0.42).toFixed(0);
        return {
          label: m,
          subLabel: '2026',
          kw: +(baseKw * factor).toFixed(2),
          kwh: monthlyKwh,
          kvarh: monthlyKvarh,
          vr: currentRecord.voltageL1,
          vs: currentRecord.voltageL2,
          vt: currentRecord.voltageL3,
          vAvg: +((currentRecord.voltageL1 + currentRecord.voltageL2 + currentRecord.voltageL3) / 3).toFixed(1),
          ir: +(currentRecord.currentL1 * factor).toFixed(2),
          is: +(currentRecord.currentL2 * factor).toFixed(2),
          it: +(currentRecord.currentL3 * factor).toFixed(2),
          in: +(Math.abs(currentRecord.currentL1 - currentRecord.currentL2) * 0.2).toFixed(2),
          iTotal: +( (currentRecord.currentL1 + currentRecord.currentL2 + currentRecord.currentL3) * factor ).toFixed(2),
          pfR: currentRecord.powerFactorL1,
          pfS: currentRecord.powerFactorL2,
          pfT: currentRecord.powerFactorL3,
          pfTotal: currentRecord.powerFactorTotal,
        };
      });
    }

    // Custom 14 Hari
    return Array.from({ length: 14 }, (_, i) => {
      const day = i + 1;
      const seedVal = Math.sin(day * 7);
      const noise = (seedVal - Math.floor(seedVal)) * 0.2;
      return {
        label: `Okt ${day.toString().padStart(2, '0')}`,
        subLabel: 'Custom',
        kw: +(baseKw * (1 + noise)).toFixed(2),
        kwh: +(baseKw * 12 * (1 + noise)).toFixed(1),
        kvarh: +(baseKw * 5 * (1 + noise)).toFixed(1),
        vr: currentRecord.voltageL1,
        vs: currentRecord.voltageL2,
        vt: currentRecord.voltageL3,
        vAvg: +((currentRecord.voltageL1 + currentRecord.voltageL2 + currentRecord.voltageL3) / 3).toFixed(1),
        ir: +(currentRecord.currentL1 * (1 + noise)).toFixed(2),
        is: +(currentRecord.currentL2 * (1 + noise)).toFixed(2),
        it: +(currentRecord.currentL3 * (1 + noise)).toFixed(2),
        in: 0.8,
        iTotal: +( (currentRecord.currentL1 + currentRecord.currentL2 + currentRecord.currentL3) * (1 + noise) ).toFixed(2),
        pfR: currentRecord.powerFactorL1,
        pfS: currentRecord.powerFactorL2,
        pfT: currentRecord.powerFactorL3,
        pfTotal: currentRecord.powerFactorTotal,
      };
    });
  })();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-150 ${
        isDark ? 'bg-slate-950/85' : 'bg-slate-900/40'
      }`}
    >
      <div
        className={`relative w-[98vw] max-w-[1780px] h-[95vh] max-h-[96vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header & Customer Quick Search Bar */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {/* Customer Info Card */}
          <div className="flex items-center gap-3 min-w-[280px]">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md shrink-0 ${
                currentRecord.anomalies.some((a) => a.severity === 'critical')
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : currentRecord.anomalies.length > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white dark:text-white">
                  {currentRecord.namaPelanggan}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {currentRecord.locationCode}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {currentRecord.tariff} / {currentRecord.power >= 1000 ? `${currentRecord.power / 1000} kVA` : `${currentRecord.power} VA`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>Meter: <strong className="text-cyan-400">{currentRecord.merkMeter}</strong> ({currentRecord.assetMeterCode || '-'})</span>
                <span>•</span>
                <span>{currentRecord.namaUp || currentRecord.unitUp}</span>
              </div>
            </div>
          </div>

          {/* Quick Manual IDPEL / Meter Serial Input */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ganti IDPEL / No. Seri Meter manual..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-mono border focus:outline-none transition ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                }`}
              />
            </div>

            {/* Dropdown suggestions */}
            {searchResults.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl border shadow-xl ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectCustomer(r)}
                    className={`w-full px-3 py-2 text-left text-xs border-b last:border-0 flex items-center justify-between transition ${
                      isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{r.namaPelanggan}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({r.locationCode})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">{r.tariff}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Close Button */}
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left Vertical Sidebar Buttons + Right Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT-ALIGNED NAVIGATION BUTTONS */}
          <div
            className={`w-52 sm:w-60 border-r flex flex-col justify-between p-3 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1">
                Menu Analisa Pelanggan
              </div>

              {/* 1. BUTTON DIAGRAM FASOR */}
              <button
                onClick={() => setActiveTab('phasor')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition border text-left ${
                  activeTab === 'phasor'
                    ? isDark
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'phasor'
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight">Diagram Fasor</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'phasor' ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                    Vektor Tegangan &amp; Arus
                  </div>
                </div>
              </button>

              {/* 2. BUTTON TREN PEMAKAIAN */}
              <button
                onClick={() => setActiveTab('trend')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition border text-left ${
                  activeTab === 'trend'
                    ? isDark
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'trend'
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight">Tren Pemakaian</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'trend' ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                    V, I, Cos φ, kWh, kVARh
                  </div>
                </div>
              </button>

              {/* 3. BUTTON PROFIL 12 BULAN */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition border text-left ${
                  activeTab === 'profile'
                    ? isDark
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'profile'
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight">Profil 12 Bulan</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'profile' ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                    Histori Pemakaian Bulanan
                  </div>
                </div>
              </button>

              {/* SPLIT SCREEN TOGGLE (Khusus Tab Fasor) */}
              {activeTab === 'phasor' && (
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setIsSplitMode(!isSplitMode)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-bold text-xs transition ${
                      isSplitMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Columns className="w-4 h-4 text-amber-400" />
                      <span>Split Screen</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isSplitMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isSplitMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Quick Action: Cetak Berita Acara P2TL */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <button
                onClick={() => printBeritaAcaraP2TL(currentRecord)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak BA P2TL</span>
              </button>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* TAB 1: DIAGRAM FASOR (SUPPORT SPLIT SCREEN) */}
            {activeTab === 'phasor' && (
              <div className="space-y-4">
                {isSplitMode ? (
                  <div>
                    {/* Split Screen Header & Customer B Selection */}
                    <div
                      className={`p-3.5 rounded-2xl border mb-4 flex flex-wrap items-center justify-between gap-3 ${
                        isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <Columns className="w-4 h-4" />
                        <span>Mode Perbandingan Fasor Bersebelahan (Split Screen)</span>
                      </div>

                      {/* Select/Search Customer B */}
                      <div className="relative flex items-center gap-2">
                        <span className="text-xs text-slate-400">Bandingkan dengan:</span>
                        <input
                          type="text"
                          value={compareSearchQuery}
                          onChange={(e) => setCompareSearchQuery(e.target.value)}
                          placeholder="Ketik IDPEL Pembanding..."
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        {compareSearchResults.length > 0 && (
                          <div
                            className={`absolute top-full right-0 mt-1 z-30 w-72 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          >
                            {compareSearchResults.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => handleSelectCompareCustomer(r)}
                                className="w-full px-3 py-2 text-left text-xs border-b last:border-0 hover:bg-slate-800 transition"
                              >
                                <div className="font-bold">{r.namaPelanggan}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{r.locationCode} • {r.tariff}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Split View Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Customer A */}
                      <div className={`p-4 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400">Pelanggan A (Primer)</span>
                            <div className="font-bold text-sm text-white">{currentRecord.namaPelanggan}</div>
                            <div className="text-[11px] font-mono text-slate-400">{currentRecord.locationCode} • {currentRecord.tariff}</div>
                          </div>
                        </div>
                        <PhasorDiagram record={currentRecord} />
                      </div>

                      {/* Customer B */}
                      <div className={`p-4 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-400">Pelanggan B (Pembanding)</span>
                            <div className="font-bold text-sm text-white">
                              {compareRecord?.namaPelanggan || 'Pilih Pelanggan Pembanding'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {compareRecord ? `${compareRecord.locationCode} • ${compareRecord.tariff}` : 'Gunakan kotak pencarian di atas'}
                            </div>
                          </div>
                        </div>
                        {compareRecord ? (
                          <PhasorDiagram record={compareRecord} />
                        ) : (
                          <div className="p-12 text-center text-slate-500 text-xs">
                            Pilih IDPEL pembanding untuk melihat diagram fasor bersebelahan.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Phasor View */
                  <div className={`p-4 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <PhasorDiagram record={currentRecord} />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TREN PEMAKAIAN (BEBAN, KWH, KVARH, VR/VS/VT, IR/IS/IT, COSPHI) */}
            {activeTab === 'trend' && (
              <div className="space-y-4">
                {/* Time Range Selector & Metric Tabs */}
                <div
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Time Range Filter Buttons */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-semibold">
                    <button
                      onClick={() => setTimeRange('harian')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        timeRange === 'harian' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Harian (24 Jam)
                    </button>
                    <button
                      onClick={() => setTimeRange('bulanan')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        timeRange === 'bulanan' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Bulanan (30 Hari)
                    </button>
                    <button
                      onClick={() => setTimeRange('tahunan')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        timeRange === 'tahunan' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tahunan (12 Bulan)
                    </button>
                    <button
                      onClick={() => setTimeRange('custom')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        timeRange === 'custom' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom Rentang
                    </button>
                  </div>

                  {/* Custom Date Pickers if custom selected */}
                  {timeRange === 'custom' && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-white"
                      />
                      <span className="text-slate-500">s/d</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  )}

                  {/* Metric Sub-Tabs */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      onClick={() => setTrendMetric('energy')}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        trendMetric === 'energy'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Beban kWh &amp; kVARh
                    </button>
                    <button
                      onClick={() => setTrendMetric('voltage')}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        trendMetric === 'voltage'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Tegangan (VR, VS, VT)
                    </button>
                    <button
                      onClick={() => setTrendMetric('current')}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        trendMetric === 'current'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Arus (IR, IS, IT, IN)
                    </button>
                    <button
                      onClick={() => setTrendMetric('cosphi')}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        trendMetric === 'cosphi'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Cos φ (Fasa &amp; Total)
                    </button>
                  </div>
                </div>

                {/* Graph Visualization Card */}
                <div
                  className={`p-6 rounded-3xl border shadow-xl ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {trendMetric === 'energy' && 'Grafik Profil Beban & Pemakaian Energi (kWh / kVARh)'}
                        {trendMetric === 'voltage' && 'Grafik Profil Tegangan Fasa (VR, VS, VT & Rata-rata)'}
                        {trendMetric === 'current' && 'Grafik Profil Arus Fasa (IR, IS, IT & Netral IN)'}
                        {trendMetric === 'cosphi' && 'Grafik Profil Faktor Daya (Cos φ Fasa & Cos φ Total)'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Periode: {timeRange.toUpperCase()} • Pelanggan: {currentRecord.namaPelanggan} ({currentRecord.locationCode})
                      </p>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">Daya Terpasang: <strong className="text-white">{currentRecord.power / 1000} kVA</strong></span>
                      <span className="text-slate-400">Cos φ Rata-rata: <strong className="text-emerald-400">{currentRecord.powerFactorTotal.toFixed(3)}</strong></span>
                    </div>
                  </div>

                  {/* SVG Chart Canvas */}
                  <div className="h-72 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[0, 60, 120, 180, 240].map((y) => (
                        <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4" />
                      ))}

                      {/* Render Bars / Lines based on trendMetric */}
                      {trendMetric === 'energy' && (
                        <>
                          {/* Energy Bars: kWh */}
                          {trendPoints.map((pt, i) => {
                            const barWidth = 900 / trendPoints.length;
                            const x = 50 + i * (900 / trendPoints.length);
                            const maxKwh = Math.max(...trendPoints.map((p) => p.kwh)) || 1;
                            const barHeight = (pt.kwh / maxKwh) * 180;
                            const y = 220 - barHeight;
                            return (
                              <g key={i} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                                <rect
                                  x={x + 2}
                                  y={y}
                                  width={Math.max(4, barWidth - 4)}
                                  height={barHeight}
                                  rx="3"
                                  className="fill-cyan-500/80 hover:fill-cyan-400 transition cursor-pointer"
                                />
                              </g>
                            );
                          })}
                        </>
                      )}

                      {trendMetric === 'voltage' && (
                        <>
                          {/* Polyline VR (Red/Cokelat), VS (Yellow), VT (Blue) */}
                          <polyline
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            points={trendPoints
                              .map((p, i) => `${50 + i * (900 / (trendPoints.length - 1))},${220 - ((p.vr - 180) / 70) * 180}`)
                              .join(' ')}
                          />
                          <polyline
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="2.5"
                            points={trendPoints
                              .map((p, i) => `${50 + i * (900 / (trendPoints.length - 1))},${220 - ((p.vs - 180) / 70) * 180}`)
                              .join(' ')}
                          />
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            points={trendPoints
                              .map((p, i) => `${50 + i * (900 / (trendPoints.length - 1))},${220 - ((p.vt - 180) / 70) * 180}`)
                              .join(' ')}
                          />
                        </>
                      )}

                      {trendMetric === 'current' && (
                        <>
                          {/* Polyline IR, IS, IT, IN */}
                          {['ir', 'is', 'it'].map((currKey, idx) => {
                            const strokeColor = idx === 0 ? '#ef4444' : idx === 1 ? '#eab308' : '#3b82f6';
                            const maxI = Math.max(...trendPoints.map((p: any) => Math.max(p.ir, p.is, p.it))) || 1;
                            return (
                              <polyline
                                key={currKey}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="2.5"
                                points={trendPoints
                                  .map((p: any, i) => `${50 + i * (900 / (trendPoints.length - 1))},${220 - (p[currKey] / maxI) * 180}`)
                                  .join(' ')}
                              />
                            );
                          })}
                        </>
                      )}

                      {trendMetric === 'cosphi' && (
                        <>
                          {/* 0.85 Threshold line */}
                          <line x1="0" y1="120" x2="1000" y2="120" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />
                          <text x="920" y="115" fill="#f43f5e" fontSize="10" fontWeight="bold">Batas 0.85</text>

                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            points={trendPoints
                              .map((p, i) => `${50 + i * (900 / (trendPoints.length - 1))},${220 - (Math.max(0, p.pfTotal) * 180)}`)
                              .join(' ')}
                          />
                        </>
                      )}
                    </svg>

                    {/* X-axis Labels */}
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 px-6">
                      {trendPoints.filter((_, idx) => idx % Math.ceil(trendPoints.length / 8) === 0).map((pt, i) => (
                        <span key={i}>{pt.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Tooltip / Selected Point Summary */}
                  <div
                    className={`mt-4 p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>Titik Terpilih: <strong>{hoveredPoint ? hoveredPoint.label : trendPoints[0]?.label}</strong></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
                      {trendMetric === 'energy' && (
                        <>
                          <span>Beban: <strong>{hoveredPoint ? hoveredPoint.kw : trendPoints[0]?.kw} kW</strong></span>
                          <span>Energi: <strong className="text-cyan-400">{hoveredPoint ? hoveredPoint.kwh : trendPoints[0]?.kwh} kWh</strong></span>
                          <span>Reaktif: <strong className="text-amber-400">{hoveredPoint ? hoveredPoint.kvarh : trendPoints[0]?.kvarh} kVARh</strong></span>
                        </>
                      )}
                      {trendMetric === 'voltage' && (
                        <>
                          <span className="text-rose-400">VR: <strong>{hoveredPoint ? hoveredPoint.vr : trendPoints[0]?.vr} V</strong></span>
                          <span className="text-amber-400">VS: <strong>{hoveredPoint ? hoveredPoint.vs : trendPoints[0]?.vs} V</strong></span>
                          <span className="text-blue-400">VT: <strong>{hoveredPoint ? hoveredPoint.vt : trendPoints[0]?.vt} V</strong></span>
                          <span className="text-emerald-400">Vavg: <strong>{hoveredPoint ? hoveredPoint.vAvg : trendPoints[0]?.vAvg} V</strong></span>
                        </>
                      )}
                      {trendMetric === 'current' && (
                        <>
                          <span className="text-rose-400">IR: <strong>{hoveredPoint ? hoveredPoint.ir : trendPoints[0]?.ir} A</strong></span>
                          <span className="text-amber-400">IS: <strong>{hoveredPoint ? hoveredPoint.is : trendPoints[0]?.is} A</strong></span>
                          <span className="text-blue-400">IT: <strong>{hoveredPoint ? hoveredPoint.it : trendPoints[0]?.it} A</strong></span>
                          <span className="text-purple-400">IN: <strong>{hoveredPoint ? hoveredPoint.in : trendPoints[0]?.in} A</strong></span>
                        </>
                      )}
                      {trendMetric === 'cosphi' && (
                        <>
                          <span className="text-rose-400">Cos φ R: <strong>{hoveredPoint ? hoveredPoint.pfR : trendPoints[0]?.pfR}</strong></span>
                          <span className="text-amber-400">Cos φ S: <strong>{hoveredPoint ? hoveredPoint.pfS : trendPoints[0]?.pfS}</strong></span>
                          <span className="text-blue-400">Cos φ T: <strong>{hoveredPoint ? hoveredPoint.pfT : trendPoints[0]?.pfT}</strong></span>
                          <span className="text-emerald-400">Total: <strong>{hoveredPoint ? hoveredPoint.pfTotal : trendPoints[0]?.pfTotal}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROFIL 12 BULAN */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <ConsumptionCharts records={[currentRecord]} selectedRecord={currentRecord} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
