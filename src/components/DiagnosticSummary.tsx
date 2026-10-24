import React from 'react';
import { AMRRecord } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingDown,
  Scale,
  Activity,
  FileDown,
  Printer,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { exportAnomaliesToCSV, printBeritaAcaraP2TL } from '../utils/reportExporter';

interface DiagnosticSummaryProps {
  records: AMRRecord[];
  onFilterClick?: (category: string) => void;
  onOpenStandardsModal?: () => void;
}

export const DiagnosticSummary: React.FC<DiagnosticSummaryProps> = ({
  records,
  onFilterClick,
  onOpenStandardsModal,
}) => {
  const { isDark } = useTheme();
  const total = records.length;
  if (total === 0) return null;

  // Counts
  const criticalCount = records.filter((r) => r.anomalies.some((a) => a.severity === 'critical')).length;
  const warningCount = records.filter(
    (r) => !r.anomalies.some((a) => a.severity === 'critical') && r.anomalies.some((a) => a.severity === 'warning')
  ).length;
  const normalCount = records.filter((r) => r.anomalies.length === 0).length;

  const reverseWiringRecords = records.filter((r) => r.anomalies.some((a) => a.category === 'wiring_reverse'));
  const lowCosphiCount = records.filter((r) =>
    r.anomalies.some((a) => a.category === 'cosphi_low' || a.category === 'cosphi_negative')
  ).length;

  // Analisis Ketidakseimbangan Arus Antar Fasa (IEEE Std 141)
  const threePhaseRecords = records.filter((r) => r.phaseType === '3-Phase');
  const unbalanceWarningCount = threePhaseRecords.filter((r) => r.currentUnbalancePct > 10 && r.currentUnbalancePct <= 20).length;
  const unbalanceCriticalCount = threePhaseRecords.filter((r) => r.currentUnbalancePct > 20).length;
  const avgCurrentUnbalance =
    threePhaseRecords.length > 0
      ? threePhaseRecords.reduce((sum, r) => sum + r.currentUnbalancePct, 0) / threePhaseRecords.length
      : 0;

  // Analisis Kualitas Daya / Harmonisa (THD IEEE Std 519)
  const highThdCount = records.filter((r) => r.thdVoltage.avg > 5.0 || r.thdCurrent.avg > 15.0).length;
  const avgThdVoltage = records.reduce((sum, r) => sum + r.thdVoltage.avg, 0) / total;
  const avgThdCurrent = records.reduce((sum, r) => sum + r.thdCurrent.avg, 0) / total;

  // Rekap Dugaan Pelanggaran Berdasarkan Perdir Direksi PLN No. 028.P/DIR/2023
  const p2tlGol1Count = records.filter((r) => r.anomalies.some((a) => a.p2tlGolongan?.includes('Golongan I'))).length;
  const p2tlGol2Count = records.filter((r) => r.anomalies.some((a) => a.p2tlGolongan?.includes('Golongan II'))).length;
  const p2tlGol3Count = records.filter((r) => r.anomalies.some((a) => a.p2tlGolongan?.includes('Golongan III'))).length;
  const p2tlGol4Count = records.filter((r) => r.anomalies.some((a) => a.p2tlGolongan?.includes('Golongan IV'))).length;

  const healthPct = total > 0 ? Math.round((normalCount / total) * 100) : 100;
  const anomalousRecords = records.filter((r) => r.anomalies.length > 0);

  return (
    <div className="space-y-4">
      {/* Top Bar: Overview & Export Actions */}
      <div
        className={`p-4 rounded-3xl border flex flex-wrap items-center justify-between gap-4 shadow-sm backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-emerald-500/30 text-white'
            : 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">Ringkasan Diagnostik AMR & Kepatuhan Standar</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluasi Berdasarkan <strong>Perdir PLN 028</strong>, <strong>IEEE Std 141</strong> (Unbalance), <strong>IEEE Std 519</strong> (THD), dan <strong>IEC 62053-22</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Print PDF P2TL */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenStandardsModal && (
            <button
              onClick={onOpenStandardsModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rujukan Standar</span>
            </button>
          )}

          <button
            onClick={() => exportAnomaliesToCSV(anomalousRecords, 'Laporan_Temuan_Anomali_P2TL')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition"
            title="Unduh seluruh rekapitulasi anomali dalam berkas CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Unduh Laporan Anomali CSV ({anomalousRecords.length})</span>
          </button>

          {anomalousRecords.length > 0 && (
            <button
              onClick={() => printBeritaAcaraP2TL(anomalousRecords[0])}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950/30 transition"
              title="Cetak Berita Acara P2TL (Perdir 028) untuk meter anomali prioritas"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara P2TL (Perdir 028)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid (4 Primary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL METER */}
        <div
          className={`rounded-2xl p-4 shadow-sm border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-slate-200/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Meter Terpantau</span>
            <Zap className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {total.toLocaleString('id-ID')}
          </div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Tingkat Kelaikan:</span>
            <span
              className={`font-bold ${
                healthPct >= 80 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-amber-500'
              }`}
            >
              {healthPct}% Normal
            </span>
          </div>
        </div>

        {/* WIRING / CT TERBALIK (Perdir 028 Golongan II) */}
        <div
          onClick={() => onFilterClick && onFilterClick('wiring_reverse')}
          className={`rounded-2xl p-4 shadow-sm border cursor-pointer transition group ${
            isDark
              ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
              : 'bg-rose-50/80 border-rose-200 hover:border-rose-400 shadow-rose-100/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-rose-300' : 'text-rose-800'}>CT / Wiring Terbalik</span>
            <ShieldAlert className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-2">
            {reverseWiringRecords.length.toLocaleString('id-ID')}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-rose-400/80' : 'text-rose-700 font-medium'}`}>
            Perdir 028 Gol. II (Daya Nyata &lt; 0)
          </div>
        </div>

        {/* KETIDAKSEIMBANGAN ARUS (IEEE Std 141) */}
        <div
          onClick={() => onFilterClick && onFilterClick('unbalance')}
          className={`rounded-2xl p-4 shadow-sm border cursor-pointer transition group ${
            unbalanceCriticalCount > 0
              ? isDark
                ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                : 'bg-amber-50 border-amber-300 hover:border-amber-400'
              : isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-amber-300' : 'text-amber-800'}>Beban Tidak Seimbang</span>
            <Scale className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {(unbalanceWarningCount + unbalanceCriticalCount).toLocaleString('id-ID')}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-amber-400/90' : 'text-amber-700 font-medium'}`}>
            {unbalanceCriticalCount > 0 ? (
              <span className="font-bold text-rose-400">🚨 {unbalanceCriticalCount} Melebihi Toleransi IEEE (&gt;20%)</span>
            ) : (
              <span>Rata-rata deviasi: {avgCurrentUnbalance.toFixed(1)}% (IEEE 141)</span>
            )}
          </div>
        </div>

        {/* KUALITAS DAYA & HARMONISA (THD IEEE Std 519) */}
        <div
          className={`rounded-2xl p-4 shadow-sm border transition ${
            isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/80 border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-indigo-300' : 'text-indigo-800'}>Harmonisa THD (IEEE 519)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-2">
            {highThdCount.toLocaleString('id-ID')}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-indigo-300/80' : 'text-indigo-700 font-medium'}`}>
            Rata-rata: THD-V {avgThdVoltage.toFixed(1)}% | THD-I {avgThdCurrent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Rujukan Perdir PLN No. 028 & Keseimbangan IEEE 141 Detailed Bar */}
      <div
        className={`p-4 rounded-2xl border text-xs grid grid-cols-1 md:grid-cols-2 gap-4 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Kolom Kiri: Klasifikasi Dugaan Pelanggaran P2TL Perdir 028 */}
        <div className="space-y-1.5">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rekapitulasi Dugaan Pelanggaran (Perdir Direksi PLN No. 028.P/DIR/2023):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Gol I (K1 - Batas)</span>
              <strong className="text-amber-400">{p2tlGol1Count} kasus</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-rose-500/30">
              <span className="text-rose-300 block text-[10px]">Gol II (K2 - Ukur)</span>
              <strong className="text-rose-400">{p2tlGol2Count} kasus</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Gol III (K3 - K1+K2)</span>
              <strong className="text-purple-400">{p2tlGol3Count} kasus</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Gol IV (K4 - Non-Pel)</span>
              <strong className="text-red-400">{p2tlGol4Count} kasus</strong>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Peringatan Keseimbangan Arus IEEE Std 141 */}
        <div className="space-y-1.5">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Toleransi Keseimbangan Beban Antar Fasa (IEEE Std 141-1993):</span>
          </div>
          <div className="text-[11px] space-y-1 text-slate-400">
            <div>
              • Batas Aman IEEE: $\le$ 10% | Warning: 10% - 20% | <strong>Kritis: &gt; 20%</strong>
            </div>
            {unbalanceCriticalCount > 0 ? (
              <div className="text-rose-400 font-semibold bg-rose-950/30 p-2 rounded-xl border border-rose-500/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Perhatian: Ditemukan {unbalanceCriticalCount} meter dengan ketidakseimbangan arus &gt; 20%. Potensi arus netral tinggi & panas berlebih pada kabel trafo.
                </span>
              </div>
            ) : (
              <div className="text-emerald-400 font-medium">
                Keseimbangan arus seluruh jaringan dalam batas toleransi normal IEEE Std 141.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
