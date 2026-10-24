import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  ShieldAlert,
  Files,
  FileText,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCw,
  Zap,
  Trash2,
  Filter,
  RefreshCw,
  HardDrive,
  Server,
  CheckSquare,
  Square,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { AMRRecord, UserProfile, ROLE_PERMISSIONS, FileValidationSummary } from '../types/amr';
import { parseAMRFilesBatch, parseCsvContent } from '../utils/amrParser';
import { downloadAMRTemplate } from '../utils/excelTemplate';
import { useTheme } from '../context/ThemeContext';
import {
  AMRBatchRecord,
  getAllBatchesOffline,
  saveBatchOffline,
  deleteBatchOffline,
  bulkDeleteBatchesOffline,
  INITIAL_SEEDED_BATCHES
} from '../utils/idbStorage';

interface DataUploaderProps {
  onDataLoaded: (records: AMRRecord[], fileName: string, summaries?: FileValidationSummary[]) => void;
  onError: (message: string) => void;
  totalLoaded: number;
  currentUser?: UserProfile | null;
  onNavigateTab?: (tab: 'dashboard' | 'phasor' | 'charts') => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  onDataLoaded,
  onError,
  totalLoaded,
  currentUser,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [lastBatchSummary, setLastBatchSummary] = useState<{
    summaries: FileValidationSummary[];
    totalValid: number;
    totalInvalid: number;
    dateRange: string[];
    warnings: string[];
  } | null>(null);

  // Database History States
  const [batches, setBatches] = useState<AMRBatchRecord[]>(INITIAL_SEEDED_BATCHES);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'instant' | 'load_profile'>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number | 'all'>('all');
  const [historyYearFilter, setHistoryYearFilter] = useState<number | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Sinkron: Server & Offline DB');

  const instantFileInputRef = useRef<HTMLInputElement>(null);
  const loadProfileFileInputRef = useRef<HTMLInputElement>(null);
  const canUpload = currentUser ? (ROLE_PERMISSIONS[currentUser.role]?.canUpload ?? true) : true;

  const refreshBatches = async () => {
    try {
      const res = await fetch('/api/database/batches').catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setBatches(json.data);
          for (const b of json.data) {
            saveBatchOffline(b).catch(() => {});
          }
          setDbStatus('Sinkron: Server DB & Offline IndexedDB');
          return;
        }
      }
    } catch (e) {
      /* fallback */
    }
    try {
      const offlineList = await getAllBatchesOffline();
      if (offlineList.length > 0) {
        setBatches(offlineList);
        setDbStatus('Offline Mode: IndexedDB Storage Aktif');
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshBatches();
  }, []);

  const handleFiles = async (files: FileList | File[], uploadType: 'instant' | 'load_profile' = 'instant') => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    const typeLabel = uploadType === 'load_profile' ? 'Load Profile (Profil Beban)' : 'Data Instant AMR';
    setLoadingProgress(`Memproses ${files.length} file ${typeLabel}...`);

    try {
      const batchResult = await parseAMRFilesBatch(files);
      setIsLoading(false);
      setLoadingProgress('');

      setLastBatchSummary({
        summaries: batchResult.summaries,
        totalValid: batchResult.totalValid,
        totalInvalid: batchResult.totalInvalid,
        dateRange: batchResult.dateRange,
        warnings: batchResult.warnings,
      });

      if (batchResult.allRecords.length > 0) {
        const title = files.length === 1
          ? `[${uploadType === 'load_profile' ? 'Load Profile' : 'Instant'}] ${files[0].name}`
          : `[${uploadType === 'load_profile' ? 'Load Profile' : 'Instant'}] Batch (${files.length} file - ${batchResult.totalValid.toLocaleString('id-ID')} record)`;
        
        onDataLoaded(batchResult.allRecords, title, batchResult.summaries);

        // Auto-save batch into server DB & Offline IndexedDB
        const now = new Date();
        const newBatch: AMRBatchRecord = {
          id: `batch-${Date.now()}`,
          fileName: files.length === 1 ? files[0].name : `Batch_${files.length}_Files_${now.toISOString().slice(0, 10)}`,
          fileType: uploadType,
          uploadTimestamp: `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          recordCount: batchResult.totalValid,
          criticalCount: batchResult.allRecords.filter(r => r.anomalies.some(a => a.severity === 'critical')).length,
          warningCount: batchResult.allRecords.filter(r => r.anomalies.length > 0 && !r.anomalies.some(a => a.severity === 'critical')).length,
          totalKva: Math.round(batchResult.allRecords.reduce((acc, r) => acc + (r.power || 0), 0) / 1000),
          unit: 'UP3 KUDUS',
        };

        saveBatchOffline(newBatch).catch(() => {});
        fetch('/api/database/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBatch),
        }).catch(() => {});

        setBatches(prev => [newBatch, ...prev]);
      } else {
        onError(`Tidak ada data ${typeLabel} yang valid berhasil diparsing. Pastikan format kolom sesuai standar PLN.`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoadingProgress('');
      onError(`Terjadi kesalahan saat memproses file: ${err.message || 'Format tidak valid'}`);
    }
  };

  const handleDropInstant = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files, 'instant');
    }
  };

  const handleDropLoadProfile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files, 'load_profile');
    }
  };

  const handleLoadSampleData = async (limitRows: number = 2000, type: 'instant' | 'load_profile' = 'instant') => {
    setIsLoading(true);
    setLoadingProgress(`Memuat data riil ${type === 'load_profile' ? 'Load Profile' : 'Instant'} AMR PLN Kudus...`);

    try {
      const response = await fetch('/assets/aistudio/52_INSTANT_20261013_9efcaeef.csv');
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file sampel (${response.statusText})`);
      }
      const text = await response.text();
      const records = parseCsvContent(text, limitRows === 0 ? 50000 : limitRows);

      setLastBatchSummary({
        summaries: [
          {
            fileName: type === 'load_profile' 
              ? '52_LOAD_PROFILE_20261013.xlsx (Simulasi Load Profile)' 
              : '52_INSTANT_20261013.csv (Data Instant PLN)',
            totalRows: records.length,
            validRows: records.length,
            invalidRows: 0,
            warnings: [],
            datesFound: ['2026-10-13'],
            isSuccess: true,
          }
        ],
        totalValid: records.length,
        totalInvalid: 0,
        dateRange: ['2026-10-13'],
        warnings: [],
      });

      onDataLoaded(
        records,
        limitRows === 0 
          ? `PLN AMR Kudus (Full 45k Record)` 
          : `PLN AMR Kudus (${type === 'load_profile' ? 'Profil Beban' : 'Data Instant'} ${records.length} Record)`
      );
    } catch (err: any) {
      onError(`Gagal memuat data sampel: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // Filtered Batches for History
  const filteredBatches = batches.filter((b) => {
    if (historyTypeFilter !== 'all' && b.fileType !== historyTypeFilter) return false;
    if (historyMonthFilter !== 'all' && b.month !== historyMonthFilter) return false;
    if (historyYearFilter !== 'all' && b.year !== historyYearFilter) return false;
    return true;
  });

  const handleToggleSelectBatch = (id: string) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedBatchIds.size === filteredBatches.length && filteredBatches.length > 0) {
      setSelectedBatchIds(new Set());
    } else {
      setSelectedBatchIds(new Set(filteredBatches.map((b) => b.id)));
    }
  };

  const handleDeleteSingleBatch = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus data batch ini dari database?')) return;
    setIsDeleting(true);
    await deleteBatchOffline(id);
    await fetch(`/api/database/batches/${id}`, { method: 'DELETE' }).catch(() => {});
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setIsDeleting(false);
  };

  const handleBulkDeleteBatches = async () => {
    if (selectedBatchIds.size === 0) return;
    if (!window.confirm(`Hapus ${selectedBatchIds.size} file batch AMR terpilih dari database server & offline?`)) return;
    setIsDeleting(true);
    const ids = Array.from(selectedBatchIds);
    await bulkDeleteBatchesOffline(ids);
    await fetch('/api/database/batches/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {});

    setBatches((prev) => prev.filter((b) => !selectedBatchIds.has(b.id)));
    setSelectedBatchIds(new Set());
    setIsDeleting(false);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className={`border rounded-3xl p-6 shadow-2xl space-y-6 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      {/* Hidden File Inputs for 2 Upload Buttons */}
      <input
        ref={instantFileInputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files, 'instant');
          e.target.value = '';
        }}
      />
      <input
        ref={loadProfileFileInputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files, 'load_profile');
          e.target.value = '';
        }}
      />

      {/* Top Banner & Actions */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <FileSpreadsheet className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Input Data AMR (Impor File Tunggal & Banyak File Excel)
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tersedia <strong>2 tombol upload terpisah</strong> untuk <strong>Data Instant</strong> (vektor tegangan, arus, fasor) dan <strong>Load Profile</strong> (profil beban interval 15/30/60 menit, multi-hari).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download Template Button */}
          <button
            onClick={downloadAMRTemplate}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-semibold transition shadow-xs ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Unduh format template Excel berstandar AMR PLN"
          >
            <Download className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Unduh Template Excel
          </button>

          {/* Quick Load Real Sample Button */}
          <div className={`flex items-center rounded-xl p-0.5 border ${
            isDark ? 'bg-indigo-950/60 border-indigo-700/50' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <button
              onClick={() => handleLoadSampleData(2500, 'instant')}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isDark
                  ? 'text-indigo-200 hover:text-white hover:bg-indigo-700/40'
                  : 'text-indigo-800 hover:text-indigo-950 hover:bg-indigo-100'
              }`}
              title="Muat 2.500 data sampel cepat dari dataset Kudus"
            >
              <Database className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              Sampel Instant (2.5k)
            </button>
            <span className={isDark ? 'text-indigo-600' : 'text-indigo-300'}>|</span>
            <button
              onClick={() => handleLoadSampleData(0, 'instant')}
              disabled={isLoading}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isDark
                  ? 'text-indigo-300 hover:text-white hover:bg-indigo-700/40'
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100'
              }`}
              title="Muat seluruh data asli 45.000 baris"
            >
              Full (45k)
            </button>
          </div>
        </div>
      </div>

      {/* 2 DISTINCT UPLOAD CARDS / BUTTONS */}
      {!canUpload ? (
        <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}>
            <Lock className="w-7 h-7" />
          </div>
          <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Fitur Unggah Data Dibatasi
          </h4>
          <p className={`text-xs mt-1.5 max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Peran Anda saat ini (<strong className="text-cyan-500 uppercase">{currentUser?.role || 'VIEWER'}</strong>) berstatus hanya-baca. Untuk mengunggah file AMR baru, silakan ganti akun atau masuk sebagai <strong className={isDark ? 'text-white' : 'text-slate-900'}>Analis AMR</strong> atau <strong className={isDark ? 'text-white' : 'text-slate-900'}>Administrator</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BUTTON / ZONE 1: UPLOAD DATA INSTANT */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDropInstant}
            className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all ${
              isDark
                ? 'border-emerald-600/50 bg-slate-950/70 hover:border-emerald-500 hover:bg-emerald-950/20'
                : 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50/70 shadow-xs'
            }`}
          >
            <div className="space-y-3 flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-950/40'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-emerald-200'
              }`}>
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono border ${
                  isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  Tombol 1: Data Instant
                </span>
                <h3 className={`text-base font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Upload Data Instant AMR
                </h3>
                <p className={`text-xs mt-1 leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Data pengukuran sesaat: <strong>Tegangan V, Arus I, Sudut Fasor, Cos φ, dan Daya per Fasa</strong>. Digunakan untuk evaluasi anomali dan diagram fasor.
                </p>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => instantFileInputRef.current?.click()}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Data Instant (Satu / Banyak File)</span>
              </button>
              <div className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Format: 52_INSTANT_YYYYMMDD.xlsx / .csv
              </div>
            </div>
          </div>

          {/* BUTTON / ZONE 2: UPLOAD LOAD PROFILE */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDropLoadProfile}
            className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all ${
              isDark
                ? 'border-cyan-600/50 bg-slate-950/70 hover:border-cyan-500 hover:bg-cyan-950/20'
                : 'border-cyan-300 bg-cyan-50/40 hover:border-cyan-500 hover:bg-cyan-50/70 shadow-xs'
            }`}
          >
            <div className="space-y-3 flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg ${
                isDark
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-950/40'
                  : 'bg-cyan-100 border-cyan-300 text-cyan-700 shadow-cyan-200'
              }`}>
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono border ${
                  isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}>
                  Tombol 2: Load Profile
                </span>
                <h3 className={`text-base font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Upload Load Profile (Profil Beban)
                </h3>
                <p className={`text-xs mt-1 leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Data deret waktu: <strong>Rekaman interval 15/30/60 menit, Stand kWh, kW Maksimum, kVARh multi-hari</strong> untuk melihat tren harian, bulanan & tahunan.
                </p>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => loadProfileFileInputRef.current?.click()}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Load Profile (Satu / Banyak File)</span>
              </button>
              <div className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Format: 52_LP_YYYYMMDD.xlsx / .csv
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator Overlay/Banner */}
      {isLoading && (
        <div className={`p-6 rounded-2xl border flex items-center justify-center gap-4 animate-in fade-in ${
          isDark ? 'bg-slate-950/90 border-cyan-500/40 text-cyan-200' : 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-md'
        }`}>
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 shrink-0" />
          <div>
            <div className="text-sm font-bold">{loadingProgress}</div>
            <div className="text-xs opacity-80 mt-0.5">Memeriksa struktur kolom, memfilter duplikasi hari sama (arus terbesar), dan menghitung pemakaian...</div>
          </div>
        </div>
      )}

      {/* VALIDATION SUMMARY REPORT MODAL / CARD */}
      {lastBatchSummary && (
        <div className={`border rounded-2xl p-5 space-y-4 animate-in fade-in ${
          isDark ? 'bg-slate-950/90 border-emerald-500/40' : 'bg-slate-50 border-emerald-300 shadow-md'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Laporan Hasil Validasi & Impor File
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {lastBatchSummary.summaries.length} File Diproses
                  </span>
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Data berhasil divalidasi dan disimpan ke memori analisis AMR.
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Buka di Tabel & Analisis
                </button>
                <button
                  onClick={() => onNavigateTab('phasor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300' : 'bg-white hover:bg-slate-100 text-cyan-800 border border-slate-200'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Cek Diagram Fasor
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Baris Valid:</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {lastBatchSummary.totalValid.toLocaleString('id-ID')}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Baris Tidak Valid/Kosong:</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${lastBatchSummary.totalInvalid > 0 ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                {lastBatchSummary.totalInvalid}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Rentang Tanggal Terdeteksi:</div>
              <div className={`text-xs font-bold font-mono mt-1 truncate ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`} title={lastBatchSummary.dateRange.join(', ')}>
                {lastBatchSummary.dateRange.length > 0 ? `${lastBatchSummary.dateRange.length} Periode (${lastBatchSummary.dateRange[0]})` : 'Otomatis'}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status Validasi:</div>
              <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                Format Sesuai SPLN
              </div>
            </div>
          </div>

          {/* Per-File Breakdown List */}
          <div className="space-y-2 pt-1">
            <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Rincian Per File:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {lastBatchSummary.summaries.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {s.isSuccess ? (
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className={`font-semibold truncate max-w-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.fileName}</span>
                  </div>
                  <div className={`flex items-center gap-4 shrink-0 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>
                      <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>{s.validRows.toLocaleString('id-ID')}</strong> valid
                    </span>
                    {s.invalidRows > 0 && (
                      <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                        {s.invalidRows} dilewati
                      </span>
                    )}
                    {s.datesFound.length > 0 && (
                      <span className={isDark ? 'text-cyan-300' : 'text-cyan-700'}>
                        📅 {s.datesFound.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings List if any */}
          {lastBatchSummary.warnings.length > 0 && (
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Catatan Validasi Data:
              </div>
              <ul className={`list-disc list-inside space-y-0.5 text-[11px] ${isDark ? 'text-amber-200/90' : 'text-amber-800/90'}`}>
                {lastBatchSummary.warnings.slice(0, 5).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {lastBatchSummary.warnings.length > 5 && (
                  <li>Dan {lastBatchSummary.warnings.length - 5} catatan lainnya...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Info Status Box */}
      {totalLoaded > 0 && !lastBatchSummary && (
        <div className={`flex items-center justify-between p-3.5 border rounded-xl text-xs ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">{totalLoaded.toLocaleString('id-ID')} Data Meter AMR siap dianalisis</span>
          </div>
          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Format otomatis dikonversi ke standar diagnostik 3-Fasa
          </div>
        </div>
      )}

      {/* HISTORI DATA AMR (DATA INSTANT & LOAD PROFILE) DENGAN CHECKLIST & FILTER BULAN/TAHUN */}
      <div
        className={`border rounded-2xl p-5 space-y-4 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Header & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Histori Data AMR (Instant &amp; Load Profile)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {batches.length} Batch Tersimpan
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Database persisten server &amp; offline IndexedDB untuk evaluasi berkelanjutan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              <Server className="w-3 h-3 text-cyan-400" />
              <span>{dbStatus}</span>
            </span>

            <button
              type="button"
              onClick={refreshBatches}
              className={`p-1.5 rounded-lg border transition ${
                isDark
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title="Segarkan data dari database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Bar: Jenis, Bulan, Tahun, Select All, Bulk Delete */}
        <div
          className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Left filters: Type, Month, Year */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Filter:</span>
            </div>

            {/* Tipe File */}
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
              className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">Semua Tipe Data</option>
              <option value="instant">Data Instant</option>
              <option value="load_profile">Load Profile</option>
            </select>

            {/* Bulan */}
            <select
              value={historyMonthFilter}
              onChange={(e) =>
                setHistoryMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">Semua Bulan</option>
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* Tahun */}
            <select
              value={historyYearFilter}
              onChange={(e) =>
                setHistoryYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">Semua Tahun</option>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Right actions: Select All checkbox & Bulk Delete */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition ${
                selectedBatchIds.size === filteredBatches.length && filteredBatches.length > 0
                  ? isDark
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : isDark
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {selectedBatchIds.size === filteredBatches.length && filteredBatches.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Pilih Semua ({filteredBatches.length})</span>
            </button>

            {selectedBatchIds.size > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleBulkDeleteBatches}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-sm animate-in fade-in"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedBatchIds.size} Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Historical Batches */}
        {filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-700/50">
            Tidak ada histori file AMR yang cocok dengan filter bulan/tahun yang dipilih.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredBatches.map((b) => {
              const isSelected = selectedBatchIds.has(b.id);
              const monthLabel = monthNames[b.month - 1] || `Bulan ${b.month}`;
              return (
                <div
                  key={b.id}
                  onClick={() => handleToggleSelectBatch(b.id)}
                  className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                        : 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Checkbox & File info */}
                  <div className="flex items-center gap-3 min-w-[260px]">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectBatch(b.id);
                      }}
                      className="cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {b.fileName}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            b.fileType === 'load_profile'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          }`}
                        >
                          {b.fileType === 'load_profile' ? 'Load Profile' : 'Data Instant'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>🕒 {b.uploadTimestamp}</span>
                        <span>•</span>
                        <span className="text-cyan-400">📅 {monthLabel} {b.year}</span>
                        <span>•</span>
                        <span>{b.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Pill */}
                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <div className="text-right">
                      <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {b.recordCount.toLocaleString('id-ID')}
                      </span>
                      <span className="text-slate-500 ml-1">meter</span>
                    </div>

                    {b.criticalCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                        🚨 {b.criticalCount} Kritis
                      </span>
                    )}

                    {b.warningCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">
                        ⚠️ {b.warningCount} Anomali
                      </span>
                    )}

                    {/* Single Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingleBatch(b.id, e)}
                      className={`p-1.5 rounded-lg border transition ${
                        isDark
                          ? 'border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400'
                          : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                      }`}
                      title="Hapus batch ini dari database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

