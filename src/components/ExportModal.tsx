import React from 'react';
import { AMRRecord } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import { exportAnomaliesToExcel, downloadAMRTemplate } from '../utils/excelTemplate';
import { exportAnomaliesToCSV, printBeritaAcaraP2TL } from '../utils/reportExporter';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Printer,
  X,
  CheckCircle,
  AlertTriangle,
  Layers,
  Database
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AMRRecord[];
  selectedRecord: AMRRecord | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  records,
  selectedRecord,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const totalAnomalies = records.filter((r) => r.anomalies.length > 0).length;
  const criticalCount = records.filter((r) => r.anomalies.some((a) => a.severity === 'critical')).length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
      }`}
    >
      <div
        className={`relative w-[96vw] max-w-5xl h-[92vh] max-h-[94vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Eksport Hasil Analisa &amp; Laporan Lapangan
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Unduh rekap data diagnosa AMR PLN ke Excel, CSV, dan Berita Acara P2TL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Quick Summary Pill */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono ${
              isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span>Total Pelanggan Teranalisa: <strong>{records.length}</strong></span>
            <span className="text-rose-400">Anomali Kritis: <strong>{criticalCount}</strong></span>
            <span className="text-amber-400">Total Anomali: <strong>{totalAnomalies}</strong></span>
          </div>

          {/* Option 1: Excel Audit Export */}
          <button
            onClick={() => {
              exportAnomaliesToExcel(records);
              onClose();
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20'
                : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition">
                Rekap Hasil Analisa Format Excel (.xlsx)
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Berisi tabel lengkap parameter tegangan, arus, sudut fasa, daya aktif negatif, dan rekomendasi investigasi per pelanggan.
              </p>
            </div>
          </button>

          {/* Option 2: CSV Export */}
          <button
            onClick={() => {
              exportAnomaliesToCSV(records);
              onClose();
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20'
                : 'bg-white border-slate-200 hover:border-cyan-500 hover:bg-cyan-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-xs text-white group-hover:text-cyan-400 transition">
                Rekap Data CSV Ringkas (.csv)
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Format data teks terpisah koma untuk integrasi dengan sistem pelaporan internal atau database PLN lain.
              </p>
            </div>
          </button>

          {/* Option 3: Cetak Berita Acara P2TL */}
          {selectedRecord && (
            <button
              onClick={() => {
                printBeritaAcaraP2TL(selectedRecord);
                onClose();
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/20'
                  : 'bg-white border-slate-200 hover:border-violet-500 hover:bg-violet-50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-xs text-white group-hover:text-violet-400 transition">
                  Cetak Berita Acara P2TL (Perdir 028) Pelanggan Terpilih
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Cetak langsung format resmi BA Pemeriksaan Lapangan untuk {selectedRecord.namaPelanggan} ({selectedRecord.locationCode}).
                </p>
              </div>
            </button>
          )}

          {/* Option 4: Unduh Template Excel AMR */}
          <button
            onClick={() => {
              downloadAMRTemplate();
              onClose();
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/40'
                : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-xs text-white">
                Download Format Template Excel AMR Kosong
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Template standar untuk memasukkan data pembacaan meter instan atau load profile secara manual.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex justify-end shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
