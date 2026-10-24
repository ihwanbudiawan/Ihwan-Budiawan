import React, { useState } from 'react';
import { useTheme, ThemePalette, BackgroundStyle } from '../context/ThemeContext';
import { NotificationSoundType } from '../utils/notificationService';
import {
  Settings,
  X,
  Palette,
  Image,
  Volume2,
  VolumeX,
  Check,
  Play,
  Sparkles,
  Sliders,
  Upload,
  RefreshCw
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    isDark,
    themePalette,
    setThemePalette,
    backgroundStyle,
    setBackgroundStyle,
    customBg,
    setCustomBg,
    notificationSound,
    setNotificationSound,
    testSound,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'theme' | 'background' | 'sound'>('theme');
  const [customBgInput, setCustomBgInput] = useState(customBg || '');

  if (!isOpen) return null;

  const themes: {
    id: ThemePalette;
    name: string;
    desc: string;
    previewBg: string;
    accentBg: string;
    textColor: string;
  }[] = [
    {
      id: 'pln-emerald',
      name: 'PLN Emerald',
      desc: 'Tema standar PLN korporat bernuansa hijau ramah lingkungan',
      previewBg: 'bg-slate-950 border-emerald-500/40',
      accentBg: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
    {
      id: 'cyber-dark',
      name: 'Midnight Cyber',
      desc: 'Nuansa futuristik neon cyan dan electric blue SCADA',
      previewBg: 'bg-slate-950 border-cyan-500/40',
      accentBg: 'bg-cyan-500',
      textColor: 'text-cyan-400',
    },
    {
      id: 'deep-space',
      name: 'Deep Space',
      desc: 'Obsidian gelap berpadu dengan nebula ungu kosmik & fuchsia',
      previewBg: 'bg-zinc-950 border-purple-500/40',
      accentBg: 'bg-purple-600',
      textColor: 'text-purple-400',
    },
    {
      id: 'electric-indigo',
      name: 'Electric Indigo',
      desc: 'Biru royal pekat dan indigo industrial telemetry',
      previewBg: 'bg-slate-950 border-indigo-500/40',
      accentBg: 'bg-indigo-600',
      textColor: 'text-indigo-400',
    },
    {
      id: 'sunset-amber',
      name: 'Sunset Amber',
      desc: 'Emas amber hangat dan aksen tembaga trafo distribusi',
      previewBg: 'bg-zinc-950 border-amber-500/40',
      accentBg: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
    {
      id: 'light-clean',
      name: 'Clean Daylight',
      desc: 'Mode terang jernih untuk operasional siang hari',
      previewBg: 'bg-slate-100 border-slate-300',
      accentBg: 'bg-emerald-600',
      textColor: 'text-emerald-700',
    },
  ];

  const backgrounds: {
    id: BackgroundStyle;
    name: string;
    desc: string;
    patternClass: string;
  }[] = [
    {
      id: 'blueprint',
      name: 'Grid Blueprint Gardu',
      desc: 'Garis grid teknis blueprint transmisi distribusi PLN',
      patternClass: 'bg-blueprint-grid bg-slate-950',
    },
    {
      id: 'circuit',
      name: 'Circuit Matrix Dots',
      desc: 'Titik-titik matriks sirkuit telekomunikasi AMR',
      patternClass: 'bg-circuit-dots bg-slate-950',
    },
    {
      id: 'mesh',
      name: 'Electric Gradient Mesh',
      desc: 'Gradasi pancaran medan elektromagnetik halus',
      patternClass: 'bg-electric-mesh bg-slate-950',
    },
    {
      id: 'solid',
      name: 'Solid Minimalis',
      desc: 'Latar polos bersih tanpa pola tekstur grafis',
      patternClass: 'bg-slate-950',
    },
    {
      id: 'custom',
      name: 'Custom Wallpaper / Warna',
      desc: 'Unggah file gambar latar atau tentukan warna sendiri',
      patternClass: 'bg-slate-900 border border-dashed border-slate-600',
    },
  ];

  const sounds: {
    id: NotificationSoundType;
    name: string;
    desc: string;
  }[] = [
    {
      id: 'chime',
      name: 'Harmonic Chime (Default)',
      desc: 'Nada harmonik ganda khas notifikasi gardu cerdas',
    },
    {
      id: 'radar',
      name: 'Substation Sonar Radar',
      desc: 'Denting frekuensi tinggi melengkung menyerupai pindaian sonar radar',
    },
    {
      id: 'bell',
      name: 'Industrial Relay Bell',
      desc: 'Lonceng resonansi bel panel proteksi trafo gardu induk',
    },
    {
      id: 'electronic',
      name: 'Electronic Dual Pulse',
      desc: 'Pulsa digital sintesis frekuensi tinggi cepat & tegas',
    },
  ];

  const handleCustomBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomBg(customBgInput);
    setBackgroundStyle('custom');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomBgInput(event.target.result);
        setCustomBg(event.target.result);
        setBackgroundStyle('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
      }`}
    >
      <div
        className={`relative w-[96vw] max-w-5xl h-[92vh] max-h-[95vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
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
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Pengaturan Sistem &amp; Kustomisasi
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sesuaikan tema warna, latar belakang visual, dan nada peringatan anomali
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

        {/* Tabs */}
        <div
          className={`flex border-b px-5 pt-2 text-xs font-semibold gap-2 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <button
            onClick={() => setActiveTab('theme')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema Warna</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeTab === 'background'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Latar Belakang (Background)</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sound'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Suara Notifikasi</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: TEMA WARNA */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Pilih palet tema untuk mengubah aksen warna UI, grafik, dan panel indikator:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((th) => {
                  const isSelected = themePalette === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setThemePalette(th.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition group relative overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/40'
                            : 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                          : isDark
                          ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${th.previewBg}`}>
                        <div className={`w-4 h-4 rounded-full ${th.accentBg}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${th.textColor}`}>
                            {th.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] line-clamp-2 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {th.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LATAR BELAKANG */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Pilih gaya motif latar belakang atau atur warna / gambar latar Anda sendiri:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backgrounds.map((bg) => {
                  const isSelected = backgroundStyle === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => setBackgroundStyle(bg.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition group relative overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/40'
                            : 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                          : isDark
                          ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-10 rounded-xl border border-slate-700 shrink-0 overflow-hidden ${bg.patternClass}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white dark:text-white">
                            {bg.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] line-clamp-2 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {bg.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom BG input area */}
              {backgroundStyle === 'custom' && (
                <div
                  className={`p-4 rounded-2xl border mt-3 space-y-3 ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className="text-xs font-semibold block text-slate-300">
                    URL Gambar Latar Belakang atau Kode Warna Hex:
                  </label>
                  <form onSubmit={handleCustomBgSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={customBgInput}
                      onChange={(e) => setCustomBgInput(e.target.value)}
                      placeholder="Contoh: #0f172a atau https://example.com/wallpaper.jpg"
                      className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                    >
                      Terapkan
                    </button>
                  </form>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer text-xs font-semibold transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {customBg && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBg('');
                          setCustomBgInput('');
                          setBackgroundStyle('blueprint');
                        }}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Reset ke Default
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUARA NOTIFIKASI */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Pilih efek audio yang berbunyi ketika sistem AMR mendeteksi anomali kritis / CT terbalik:
              </div>

              <div className="space-y-2.5">
                {sounds.map((s) => {
                  const isSelected = notificationSound === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setNotificationSound(s.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? isDark
                            ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/40'
                            : 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                          : isDark
                          ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : isDark
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white dark:text-white">
                            {s.name}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {s.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => testSound(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-semibold text-xs transition"
                          title="Uji Putar Suara Ini"
                        >
                          <Play className="w-3 h-3 fill-emerald-400" />
                          <span>Uji Suara</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex justify-end shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
