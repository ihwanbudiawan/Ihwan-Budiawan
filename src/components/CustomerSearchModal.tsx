import React, { useState, useMemo } from 'react';
import { AMRRecord } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import { Search, X, RotateCw, TrendingUp, Columns, ArrowRight, Zap, ShieldAlert, CheckCircle } from 'lucide-react';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: AMRRecord[];
  mode: 'phasor' | 'trend';
  onSelectCustomer: (record: AMRRecord, openSplitMode?: boolean) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  mode,
  onSelectCustomer,
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [splitMode, setSplitMode] = useState(false);

  const filteredRecords = useMemo(() => {
    if (!query.trim()) {
      return allRecords.slice(0, 10);
    }
    const q = query.toLowerCase().trim();
    return allRecords.filter(
      (r) =>
        r.locationCode.toLowerCase().includes(q) ||
        r.namaPelanggan.toLowerCase().includes(q) ||
        (r.assetMeterCode && r.assetMeterCode.toLowerCase().includes(q)) ||
        (r.tariff && r.tariff.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [query, allRecords]);

  if (!isOpen) return null;

  const handleChoose = (rec: AMRRecord) => {
    onSelectCustomer(rec, splitMode);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
      }`}
    >
      <div
        className={`relative w-[96vw] max-w-4xl h-[90vh] max-h-[94vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
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
                mode === 'phasor'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {mode === 'phasor' ? <RotateCw className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                {mode === 'phasor' ? 'Pilih Pelanggan — Diagram Fasor' : 'Pilih Pelanggan — Grafik & Tren'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Masukkan ID Pelanggan (IDPEL) atau No. Seri Meter untuk investigasi
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

        {/* Input & Split Screen option */}
        <div className="p-5 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik IDPEL (misal: 52000...) atau Nama atau No. Seri Meter..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono border focus:outline-none transition ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
          </div>

          {mode === 'phasor' && (
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={splitMode}
                onChange={(e) => setSplitMode(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 font-semibold">
                <Columns className="w-3.5 h-3.5 text-amber-400" />
                <span>Buka langsung dalam mode Split Screen (Perbandingan dengan pelanggan lain)</span>
              </div>
            </label>
          )}
        </div>

        {/* List of matches */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ditemukan data IDPEL atau nama pelanggan yang cocok.
            </div>
          ) : (
            filteredRecords.map((r) => {
              const hasCritical = r.anomalies.some((a) => a.severity === 'critical');
              return (
                <button
                  key={r.id}
                  onClick={() => handleChoose(r)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    isDark
                      ? 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        hasCritical
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : r.anomalies.length > 0
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{r.namaPelanggan}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">{r.locationCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{r.tariff} / {(r.power / 1000).toFixed(0)} kVA</span>
                        <span>•</span>
                        <span>Meter: {r.merkMeter} ({r.assetMeterCode || '-'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasCritical && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        🚨 CT Terbalik
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t text-center text-[11px] text-slate-500 ${
            isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          Klik pelanggan untuk langsung membuka {mode === 'phasor' ? 'diagram fasor' : 'grafik tren'}
        </div>
      </div>
    </div>
  );
};
