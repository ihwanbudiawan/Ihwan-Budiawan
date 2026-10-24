import React, { useState, useMemo } from 'react';
import { AMRRecord, MonthlyAmrHistory } from '../types/amr';
import {
  Activity,
  Zap,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  Sun,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CustomerTrendChart } from './CustomerTrendChart';

interface ConsumptionChartsProps {
  currentRecord?: AMRRecord | null;
  selectedRecord?: AMRRecord | null;
  records?: AMRRecord[];
  historyRecords?: AMRRecord[];
}

export const ConsumptionCharts: React.FC<ConsumptionChartsProps> = ({
  currentRecord: propCurrent,
  selectedRecord: propSelected,
  records = [],
  historyRecords = [],
}) => {
  const { isDark } = useTheme();

  // Selected customer fallback
  const allAvailable = records.length > 0 ? records : historyRecords;
  const initial = propSelected || propCurrent || (allAvailable.length > 0 ? allAvailable[0] : null);

  const [activeRecordId, setActiveRecordId] = useState<string>(initial?.id || '');
  const activeRecord = allAvailable.find((r) => r.id === activeRecordId) || initial;

  const [activeTab, setActiveTab] = useState<'cumulative' | 'health_trend' | 'voltage_phases' | 'load_phases' | 'detailed_trend'>('cumulative');

  // Customer's 12 months history
  const history12: MonthlyAmrHistory[] = useMemo(() => {
    if (!activeRecord) return [];
    if (activeRecord.historical12Months && activeRecord.historical12Months.length > 0) {
      return activeRecord.historical12Months;
    }
    // Synthetic fallback if missing
    const baseKwh = Math.max(1000, activeRecord.actualPowerKw * 24 * 30);
    const months = ['Nov 25', 'Des 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'Mei 26', 'Jun 26', 'Jul 26', 'Agu 26', 'Sep 26', 'Okt 26'];
    const codes = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    return months.map((label, idx) => ({
      month: codes[idx],
      label,
      kwhImport: Math.round(baseKwh * (0.85 + 0.3 * Math.sin(idx * 0.5))),
      kwhExport: activeRecord.standKwhExport > 0 ? Math.round(baseKwh * 0.22 * (0.9 + 0.2 * Math.cos(idx * 0.5))) : 0,
      kvarh: Math.round(baseKwh * 0.28),
      pf: 0.90,
      healthScore: Math.max(40, Math.min(100, activeRecord.healthScore + (11 - idx))),
      unbalancePct: Math.round(activeRecord.currentUnbalancePct + (idx % 4) - 2),
      anomalyCount: activeRecord.healthScore < 70 ? 2 : 0,
      vAvg: 230,
      iAvg: activeRecord.currentL1 || 15,
    }));
  }, [activeRecord]);

  if (!activeRecord) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-800">
        Pilih atau unggah data pelanggan untuk melihat visualisasi grafik dan tren.
      </div>
    );
  }

  // Cumulative sums calculation
  let runningImport = 0;
  let runningExport = 0;
  const cumulativeData = history12.map((m) => {
    runningImport += m.kwhImport;
    runningExport += m.kwhExport;
    return {
      ...m,
      cumulativeImport: runningImport,
      cumulativeExport: runningExport,
      netCumulative: runningImport - runningExport,
    };
  });

  const maxCumulativeKwh = Math.max(...cumulativeData.map((d) => d.cumulativeImport), 1000);
  const maxMonthlyKwh = Math.max(...history12.map((d) => Math.max(d.kwhImport, d.kwhExport)), 100);

  return (
    <div
      className={`border rounded-3xl p-6 shadow-2xl transition-colors space-y-6 ${
        isDark ? 'bg-slate-900/95 border-emerald-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Header & Customer Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold">Grafik Pemakaian Energi & Tren Kesehatan Meter</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisasi kumulatif kWh Import vs Export 12 bulan terakhir • Agregasi tren kesehatan & anomali 6-12 bulan • Profil fasa lengkap
          </p>
        </div>

        {/* Customer Dropdown Switcher */}
        {allAvailable.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Pilih Pelanggan:</span>
            <select
              value={activeRecord.id}
              onChange={(e) => setActiveRecordId(e.target.value)}
              className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none"
            >
              {allAvailable.slice(0, 60).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.locationCode} - {r.namaPelanggan} ({r.tariff})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('cumulative')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'cumulative'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Kumulatif kWh Import vs Export (12 Bulan)</span>
        </button>

        <button
          onClick={() => setActiveTab('health_trend')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'health_trend'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tren Kesehatan & Anomali (6-12 Bulan)</span>
        </button>

        <button
          onClick={() => setActiveTab('voltage_phases')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'voltage_phases'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Tegangan Tiap Fasa (VR, VS, VT)</span>
        </button>

        <button
          onClick={() => setActiveTab('load_phases')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'load_phases'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Beban & Arus Fasa (PR/PS/PT & IR/IS/IT/IN)</span>
        </button>

        <button
          onClick={() => setActiveTab('detailed_trend')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
            activeTab === 'detailed_trend'
              ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Tren Harian/Bulanan/Tahunan</span>
        </button>
      </div>

      {/* Customer Info Badge Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">Pelanggan Aktif:</span>{' '}
          <strong className="text-white text-sm">{activeRecord.namaPelanggan}</strong>{' '}
          <span className="font-mono text-cyan-400 font-bold">({activeRecord.locationCode})</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span>Tarif: <strong className="text-emerald-400">{activeRecord.tariff}</strong></span>
          <span>Daya: <strong className="text-emerald-400">{(activeRecord.power / 1000).toLocaleString('id-ID')} kVA</strong></span>
          <span>Stand kWh Import: <strong className="text-white">{activeRecord.standKwhImport.toLocaleString('id-ID')}</strong></span>
          <span>Stand kWh Export: <strong className="text-amber-400">{activeRecord.standKwhExport.toLocaleString('id-ID')}</strong></span>
        </div>
      </div>

      {/* TAB 1: KUMULATIF KWH IMPORT VS EXPORT (12 BULAN) */}
      {activeTab === 'cumulative' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Visualisasi Tren Kumulatif kWh Import vs Export (12 Bulan Terakhir)
              </h4>
              <p className="text-xs text-slate-400">
                Membandingkan energi yang diserap dari grid PLN (Import) dengan energi kirim/surplus PLTS (Export) secara kumulatif.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span>Kumulatif Import (Total: {runningImport.toLocaleString('id-ID')} kWh)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>Kumulatif Export (Total: {runningExport.toLocaleString('id-ID')} kWh)</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Canvas / SVG Comparison */}
          <div className="h-64 relative flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {cumulativeData.map((d, idx) => {
              const hImport = Math.round((d.cumulativeImport / maxCumulativeKwh) * 100);
              const hExport = Math.round((d.cumulativeExport / maxCumulativeKwh) * 100);

              return (
                <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 bg-slate-950 border border-slate-700 p-2 rounded-xl text-[10px] font-mono shadow-xl whitespace-nowrap">
                    <div className="font-bold text-white">{d.label} ({d.month})</div>
                    <div className="text-emerald-400">Kum. Import: {d.cumulativeImport.toLocaleString('id-ID')} kWh (+{d.kwhImport} kWh)</div>
                    <div className="text-amber-400">Kum. Export: {d.cumulativeExport.toLocaleString('id-ID')} kWh (+{d.kwhExport} kWh)</div>
                    <div className="text-cyan-300">Net Konsumsi: {d.netCumulative.toLocaleString('id-ID')} kWh</div>
                  </div>

                  {/* Dual Bar side-by-side */}
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${Math.max(4, hImport)}%` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-700 to-teal-400 rounded-t-md transition-all group-hover:brightness-125"
                    />
                    <div
                      style={{ height: `${Math.max(2, hExport)}%` }}
                      className="w-1/2 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-md transition-all group-hover:brightness-125"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-2 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Monthly Incremental Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Bulan</th>
                  <th className="py-2 px-3 text-right text-emerald-400">Bulanan Import (kWh)</th>
                  <th className="py-2 px-3 text-right text-amber-400">Bulanan Export (kWh)</th>
                  <th className="py-2 px-3 text-right text-white">Kumulatif Import (kWh)</th>
                  <th className="py-2 px-3 text-right text-yellow-300">Kumulatif Export (kWh)</th>
                  <th className="py-2 px-3 text-right text-cyan-400">Net Konsumsi Grid (kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cumulativeData.map((d) => (
                  <tr key={d.month} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-white">{d.label}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">+{d.kwhImport.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right text-amber-400">+{d.kwhExport.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right text-white font-bold">{d.cumulativeImport.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right text-yellow-300 font-bold">{d.cumulativeExport.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right text-cyan-400 font-bold">{d.netCumulative.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AGREGASI TREN KESEHATAN METER & ANOMALI (6-12 BULAN) */}
      {activeTab === 'health_trend' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Agregasi Tren Skor Kesehatan Meter (Health Score) & Temuan Anomali (6-12 Bulan)
            </h4>
            <p className="text-xs text-slate-400">
              Mendeteksi degradasi komponen bertahap (pergeseran impedansi CT/PT, panas berlebih, penurunan cosphi).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Visual Health Score Trajectory */}
            <div className="md:col-span-8 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Trajektori Skor Kesehatan (0 - 100)</span>
                <span className="text-emerald-400 font-bold font-mono">
                  Saat Ini: {activeRecord.healthScore}/100
                </span>
              </div>

              {/* Line graph visualization */}
              <div className="h-48 relative flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
                {history12.map((h, idx) => {
                  const barHeight = Math.max(10, h.healthScore);
                  const isDegrading = idx > 0 && h.healthScore < history12[idx - 1].healthScore;

                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-[10px] font-mono shadow whitespace-nowrap">
                        {h.label}: Skor {h.healthScore} ({h.anomalyCount} Anomali)
                      </div>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          h.healthScore >= 80
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : h.healthScore >= 60
                            ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                            : 'bg-gradient-to-t from-rose-600 to-red-400'
                        }`}
                      />
                      <span className="text-[9px] text-slate-400 font-mono mt-1">{h.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Score Summary Stats Card */}
            <div className="md:col-span-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-white block">Evaluasi Kesehatan 12 Bulan</span>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Skor Rata-rata:</span>
                  <strong className="font-mono text-emerald-400">
                    {Math.round(history12.reduce((s, h) => s + h.healthScore, 0) / history12.length)}/100
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Bulan Paling Kritis:</span>
                  <strong className="font-mono text-rose-400">
                    {[...history12].sort((a, b) => a.healthScore - b.healthScore)[0]?.label}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Deviasi Beban Rata-rata:</span>
                  <strong className="font-mono text-amber-400">
                    {(history12.reduce((s, h) => s + h.unbalancePct, 0) / history12.length).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEGANGAN TIAP FASA (VR, VS, VT) */}
      {activeTab === 'voltage_phases' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Monitoring Tegangan Tiap Fasa (VR, VS, VT) Terhadap Standar SPLN
            </h4>
            <p className="text-xs text-slate-400">
              Batas toleransi tegangan standar PLN: Drop -10% (198V) dan Naik +6% s/d +10% (246V).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Fasa R */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-400">Tegangan Fasa R (VR)</span>
                <span className="font-mono text-[10px] text-slate-400">Sudut: {activeRecord.voltageAngleL1}°</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {activeRecord.voltageL1.toFixed(1)} <span className="text-sm font-normal text-slate-400">Volt</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (activeRecord.voltageL1 / 250) * 100)}%` }}
                  className="bg-red-500 h-full rounded-full"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Status: {activeRecord.voltageL1 < 198 ? 'Under-Voltage' : activeRecord.voltageL1 > 246 ? 'Over-Voltage' : 'Normal Standar'}
              </div>
            </div>

            {/* Fasa S */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-yellow-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-yellow-400">Tegangan Fasa S (VS)</span>
                <span className="font-mono text-[10px] text-slate-400">Sudut: {activeRecord.voltageAngleL2}°</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {activeRecord.voltageL2.toFixed(1)} <span className="text-sm font-normal text-slate-400">Volt</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (activeRecord.voltageL2 / 250) * 100)}%` }}
                  className="bg-yellow-500 h-full rounded-full"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Status: {activeRecord.voltageL2 < 198 ? 'Under-Voltage' : activeRecord.voltageL2 > 246 ? 'Over-Voltage' : 'Normal Standar'}
              </div>
            </div>

            {/* Fasa T */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">Tegangan Fasa T (VT)</span>
                <span className="font-mono text-[10px] text-slate-400">Sudut: {activeRecord.voltageAngleL3}°</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {activeRecord.voltageL3.toFixed(1)} <span className="text-sm font-normal text-slate-400">Volt</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (activeRecord.voltageL3 / 250) * 100)}%` }}
                  className="bg-blue-500 h-full rounded-full"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Status: {activeRecord.voltageL3 < 198 ? 'Under-Voltage' : activeRecord.voltageL3 > 246 ? 'Over-Voltage' : 'Normal Standar'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BEBAN & ARUS PER FASA (PR/PS/PT & IR/IS/IT/IN) */}
      {activeTab === 'load_phases' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Distribusi Pembebanan Daya Aktif & Arus Tiap Fasa
            </h4>
            <p className="text-xs text-slate-400">
              Evaluasi keseimbangan beban antar fasa dan deteksi aliran daya aktif negatif (CT Terbalik).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Fasa R (IR & PR)</span>
              <div className="text-lg font-bold font-mono text-red-400">{activeRecord.currentL1.toFixed(2)} A</div>
              <div className="text-[11px] text-slate-300 font-mono">Daya: {activeRecord.actualPowerKwL1.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-500 font-mono">Cos φ: {activeRecord.powerFactorL1.toFixed(2)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Fasa S (IS & PS)</span>
              <div className="text-lg font-bold font-mono text-yellow-400">{activeRecord.currentL2.toFixed(2)} A</div>
              <div className="text-[11px] text-slate-300 font-mono">Daya: {activeRecord.actualPowerKwL2.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-500 font-mono">Cos φ: {activeRecord.powerFactorL2.toFixed(2)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Fasa T (IT & PT)</span>
              <div className="text-lg font-bold font-mono text-blue-400">{activeRecord.currentL3.toFixed(2)} A</div>
              <div className="text-[11px] text-slate-300 font-mono">Daya: {activeRecord.actualPowerKwL3.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-500 font-mono">Cos φ: {activeRecord.powerFactorL3.toFixed(2)}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-1">
              <span className="text-purple-300 font-semibold">Arus Netral (IN)</span>
              <div className="text-lg font-bold font-mono text-purple-400">{activeRecord.currentN.toFixed(2)} A</div>
              <div className="text-[11px] text-slate-300 font-mono">Unbalance: {activeRecord.currentUnbalancePct.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500">Standar IEEE 141</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DETAILED TREND CHART */}
      {activeTab === 'detailed_trend' && (
        <div className="pt-2">
          <CustomerTrendChart record={activeRecord} />
        </div>
      )}
    </div>
  );
};
