import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Database, UploadCloud, X, FileText, CheckCircle, Clock, Zap } from 'lucide-react';

interface LoadProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoaded?: (fileName: string, recordCount: number) => void;
}

export const LoadProfileModal: React.FC<LoadProfileModalProps> = ({ isOpen, onClose, onLoaded }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [intervalOption, setIntervalOption] = useState<'15' | '30' | '60'>('15');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulateLoad = () => {
    setIsSuccess(true);
    setTimeout(() => {
      if (onLoaded) onLoaded(selectedFileName || '52_LOAD_PROFILE_20261013.csv', 96);
      onClose();
    }, 900);
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
                isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-100 border-indigo-300 text-indigo-700'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Import Data Load Profile AMR
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Format profil beban berkala (Interval 15, 30, atau 60 menit)
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

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Interval selector */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-700 bg-slate-950/50 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Interval Rekaman Meter:
            </span>
            <div className="flex items-center gap-1">
              {(['15', '30', '60'] as const).map((int) => (
                <button
                  key={int}
                  onClick={() => setIntervalOption(int)}
                  className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                    intervalOption === int
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {int} Menit
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) setSelectedFileName(file.name);
            }}
            className={`p-8 border-2 border-dashed rounded-3xl text-center transition cursor-pointer ${
              dragActive
                ? 'border-indigo-400 bg-indigo-950/30'
                : isDark
                ? 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
            <div className="font-bold text-xs text-white">
              {selectedFileName ? selectedFileName : 'Tarik & Letakkan File Load Profile (.csv / .xlsx)'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Atau klik untuk memilih file dari komputer
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFileName(file.name);
              }}
              className="hidden"
              id="load-profile-file-input"
            />
            <label
              htmlFor="load-profile-file-input"
              className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Pilih Berkas
            </label>
          </div>

          {/* Preset Demo Load Profile */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Gunakan data sampel integrasi:</span>
            <button
              type="button"
              onClick={() => setSelectedFileName('52_LOADPROFILE_SAMPLE_OCT2026.csv')}
              className="text-indigo-400 hover:underline font-semibold"
            >
              Sampel 96 Titik (24 Jam)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleSimulateLoad}
            disabled={!selectedFileName}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedFileName
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSuccess ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4" />}
            <span>{isSuccess ? 'Berhasil Diimpor!' : 'Proses & Muat Profil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
