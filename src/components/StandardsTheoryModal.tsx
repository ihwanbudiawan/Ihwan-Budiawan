import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  X,
  ShieldCheck,
  Zap,
  RotateCw,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Activity,
  Compass,
  ArrowRight
} from 'lucide-react';

interface StandardsTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'standards' | 'theory' | 'phasor' | 'p2tl' | 'international';
}

export const StandardsTheoryModal: React.FC<StandardsTheoryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'standards',
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'standards' | 'theory' | 'phasor' | 'p2tl' | 'international'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-150 ${
      isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
    }`}>
      <div className={`relative w-[96vw] max-w-[1700px] h-[94vh] max-h-[96vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Rujukan Standar Regulasi & Teori Kelistrikan AMR PLN
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  SPLN • IEC • IEEE • ANSI • ISO
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Dokumentasi resmi standar SPLN, SNI PUIL 2020, IEC, IEEE, ANSI, ISO, dan pedoman analisa diagram fasor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-5 pt-2 text-xs font-semibold overflow-x-auto gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <button
            onClick={() => setActiveTab('standards')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'standards'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>1. Standar PLN & ESDM</span>
          </button>
          <button
            onClick={() => setActiveTab('international')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'international'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Standar IEC, IEEE, ANSI & ISO</span>
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'theory'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3. Teori & Rumus</span>
          </button>
          <button
            onClick={() => setActiveTab('phasor')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'phasor'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>4. Panduan Diagram Fasor</span>
          </button>
          <button
            onClick={() => setActiveTab('p2tl')}
            className={`pb-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'p2tl'
                ? isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-700'
                : isDark ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Investigasi P2TL</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs leading-relaxed">
          {/* TAB 1: STANDAR RESMI PLN & ESDM */}
          {activeTab === 'standards' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Card 1: SPLN D3.022-1:2012 */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-500">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>SPLN D3.022-1:2012 — Spesifikasi Meter Statik Energi Listrik Fase Tunggal & Tiga</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    Acuan AMR
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-slate-300 dark:text-slate-300">
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Standar utama PLN untuk pengadaan dan pengoperasian meter elektronik statik otomatis (AMR/AMI). Mengatur:
                  </p>
                  <ul className={`list-disc pl-5 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li><strong>Kelas Akurasi:</strong> Kelas 0.2S atau 0.5S untuk pelanggan TM/TT (Pengukuran Tidak Langsung) dan Kelas 1.0 untuk pelanggan TR (Pengukuran Langsung).</li>
                    <li><strong>Parameter Instant yang Wajib Tersimpan:</strong> Tegangan per fasa (VR, VS, VT), Arus per fasa (IR, IS, IT), Sudut Fasa Tegangan &amp; Arus (∠V, ∠I), Faktor Daya (Cos φ), serta Daya Aktif &amp; Reaktif per fasa.</li>
                    <li><strong>Interval Pencatatan Load Profile:</strong> Default periodik 15 menit, 30 menit, atau 60 menit per hari dengan penanda waktu terstandardisasi (*time stamp* YYYYMMDD).</li>
                  </ul>
                </div>
              </div>

              {/* Card 2: SPLN 1:1995 Tegangan Standar PLN */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-500">
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>SPLN 1:1995 — Batas Variasi & Toleransi Tegangan Sistem Distribusi PLN</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                  }`}>
                    Kualitas Daya
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Standar toleransi fluktuasi tegangan pada titik sambung pelanggan (APP):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center font-mono">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-[11px] font-sans text-slate-400">Tegangan Rendah (TR 230V / 400V)</div>
                      <div className="text-base font-bold text-emerald-400 mt-1">207 V s.d. 241,5 V</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Toleransi: -10% s.d. +5%</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-[11px] font-sans text-slate-400">Tegangan Menengah (TM Sekunder 100V)</div>
                      <div className="text-base font-bold text-cyan-400 mt-1">90 V s.d. 105 V</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Toleransi: -10% s.d. +5%</div>
                    </div>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                    ⚠️ <em>Jika tegangan &lt; 207V diindikasikan sebagai <strong>Under-Voltage / Drop Tegangan</strong>, dan tegangan &gt; 242V diindikasikan sebagai <strong>Over-Voltage</strong>.</em>
                  </p>
                </div>
              </div>

              {/* Card 3: Permen ESDM No. 28/2016 jo No. 13/2021 (Cosphi & kVARh) */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-500">
                    <Scale className="w-4 h-4 shrink-0" />
                    <span>Permen ESDM No. 28/2016 jo No. 13/2021 — Batas Faktor Daya (Cos φ ≥ 0,85)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    Regulasi Tarif
                  </span>
                </div>
                <div className={`mt-2.5 space-y-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p>
                    Pelanggan tarif Industri (I2, I3, I4) dan Bisnis (B2, B3) diwajibkan menjaga faktor daya rata-rata bulanan minimal <strong>0,85</strong>.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Bila faktor daya rata-rata Cos φ &lt; 0,85, pelanggan dikenakan <strong>Biaya Kelebihan Pemakaian Daya Reaktif (kVARh)</strong>.</li>
                    <li>Bila Cos φ &lt; 0 (negatif), sistem AMR menandai adanya pembalikan pengawatan CT atau penginjeksian daya reaktif tidak normal.</li>
                  </ul>
                </div>
              </div>

              {/* Card 4: PUIL 2020 / SNI 0225:2020 */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-purple-400 mb-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>SNI 0225:2020 / PUIL 2020 — Pengawatan & Kode Warna Fasa Listrik PLN</span>
                </div>
                <div className={`space-y-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p>Urutan fase standar PLN Indonesia:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px] mt-1">
                    <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                      <strong>Fasa R (L1)</strong>: Cokelat / Merah
                    </div>
                    <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
                      <strong>Fasa S (L2)</strong>: Hitam / Kuning
                    </div>
                    <div className="p-2 rounded-lg bg-slate-600/20 text-slate-300 border border-slate-500/30">
                      <strong>Fasa T (L3)</strong>: Abu-abu / Hitam
                    </div>
                    <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      <strong>Netral (N)</strong>: Biru Terang
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STANDAR INTERNASIONAL (IEC, IEEE, ANSI, ISO) */}
          {activeTab === 'international' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* SECTION A: IEC STANDARDS */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3 border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>STANDAR IEC (International Electrotechnical Commission)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Metering & PQ
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-cyan-400 block text-xs">IEC 62053-21 & IEC 62053-22: Akurasi Meter Statik Energi Aktif</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      - <strong>IEC 62053-21:</strong> Mengatur meter statik kelas 1.0 dan 2.0 untuk pengukuran langsung pelanggan tegangan rendah (TR). Batas kesalahan relatif pada arus nominal In dan cos φ = 1 adalah maks ±1.0%.<br/>
                      - <strong>IEC 62053-22:</strong> Mengatur meter statik presisi tinggi Kelas 0.2S dan Kelas 0.5S untuk pengukuran pelanggan tegangan menengah (TM) dan gardu transmisi. Awalan "S" menandakan batas akurasi ketat hingga beban sangat rendah (0.01 In / 1% beban nominal).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-cyan-400 block text-xs">IEC 62053-23: Meter Statik Energi Reaktif (kVARh)</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Mengatur spesifikasi meter energi reaktif kelas 2.0 dan 3.0. Menjadi basis verifikasi penagihan kelebihan kVARh (bila faktor daya rata-rata bulanan &lt; 0.85).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-cyan-400 block text-xs">IEC 61000-4-30: Power Quality Measurement Methods</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Standar metode pengukuran kualitas daya (harmonisa, unbalance, sags/swells, fluktuasi). Menetapkan instrumen Kelas A (presisi legal & kontrak) dan Kelas S (survei statistik & AMR operasional).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-cyan-400 block text-xs">IEC 61869-2 (Evolusi dari IEC 60044-1): Trafo Arus (Current Transformers - CT)</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Menetapkan penandaan terminal polaritas P1-P2 (primer) dan S1-S2 atau k-l (sekunder). Standar menetapkan bila arus primer mengalir dari P1 ke P2, maka arus sekunder harus keluar dari S1 melalui beban meter dan kembali ke S2. Pembalikan sambungan mengakibatkan sudut arus bergeser 180° dan daya aktif bernilai negatif.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B: IEEE STANDARDS */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3 border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
                    <Zap className="w-4 h-4 shrink-0" />
                    <span>STANDAR IEEE (Institute of Electrical and Electronics Engineers)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Power & Quality
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-indigo-400 block text-xs">IEEE 519-2022: Standard for Harmonic Control in Electric Power Systems</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Menetapkan batas maksimum Total Harmonic Distortion (THD-V) tegangan sebesar &lt; 5.0% untuk sistem distribusi tegangan rendah hingga menengah (&lt; 69 kV). Distorsi arus harmonik individu dibatasi berdasarkan rasio hubung singkat Isc/IL di Titik Sambung Bersama (PCC).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-indigo-400 block text-xs">IEEE 1459-2010: Measurement of Electric Power Under Non-Sinusoidal &amp; Unbalanced Conditions</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Memisahkan daya fundamental dan harmonik: Daya Aktif Fundamental (P1), Daya Reaktif Fundamental (Q1), Daya Semu Fundamental (S1), dan Daya Distorsi Non-Fundamental (SN). Memberikan formulasi akurat untuk faktor daya sesungguhnya (True Power Factor vs Displacement Power Factor).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-indigo-400 block text-xs">IEEE 141 (Red Book) &amp; IEEE C57.13: Ketidakseimbangan Beban &amp; Trafo Ukur</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      - <strong>IEEE 141:</strong> Ketidakseimbangan beban arus 3-fasa idealnya &lt; 10%, dan deviasi tegangan tidak melebihi 2.0% - 2.5% agar mencegah pemanasan berlebih pada motor induksi pelanggan dan transformator distribusi.<br/>
                      - <strong>IEEE C57.13:</strong> Standar persyaratan trafo instrumen (CT dan PT) Amerika Utara mengenai batas kejenuhan inti (saturation knee point) dan rating burden burden ohmik.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION C: ANSI STANDARDS */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3 border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                    <Scale className="w-4 h-4 shrink-0" />
                    <span>STANDAR ANSI (American National Standards Institute)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    North America Metering
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-amber-400 block text-xs">ANSI C12.1: Code for Electricity Metering</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Kode komprehensif pemasangan, pengujian lapangan, pemeliharaan, dan toleransi pengoperasian meter energi listrik statik dan elektromekanik. Mewajibkan meter mendeteksi dan mengunci registrasi saat terjadi aliran daya balik (reverse energy flow detection).
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-amber-400 block text-xs">ANSI C12.20: 0.1, 0.2, and 0.5 Accuracy Classes</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Standar kelas akurasi meter pendapatan (revenue meters). Menjadi referensi firmware meter modern multi-merk (WASION, HEXING, EDMI, dll.) dalam menghitung akumulasi energi 4-kuadran (+kWh, -kWh, +kVARh, -kVARh).
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION D: ISO STANDARDS */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3 border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>STANDAR ISO (International Organization for Standardization)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Management & Testing
                  </span>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-emerald-400 block text-xs">ISO 50001: Sistem Manajemen Energi (Energy Management Systems)</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Menuntut kepatuhan pengukuran energi yang akurat, pembentukan Garis Dasar Energi (Energy Baseline - EnB), dan Indikator Kinerja Energi (EnPI). Data AMR interval 15/30 menit menjadi rujukan pemantauan efisiensi dan mitigasi kerugian susut teknis/non-teknis.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-emerald-400 block text-xs">ISO/IEC 17025: Persyaratan Umum Kompetensi Laboratorium Pengujian &amp; Kalibrasi</strong>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Kualifikasi resmi laboratorium tera metrologi PLN dalam menguji keabsahan meter AMR, akurasi rasio CT/PT, ketidakpastian pengukuran (measurement uncertainty), dan ketertelusuran (traceability) ke standar nasional/internasional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEORI KELISTRIKAN & RUMUS */}
          {activeTab === 'theory' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Rumus Konversi Daya & FK */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  <span>1. Rumus Pemakaian Sebenarnya (kW) & Faktor Kali (FK)</span>
                </h4>
                <p className={`mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Data instant AMR dari meter elektronik mencatat nilai daya sekunder dalam satuan Watt. Untuk mendapatkan pemakaian daya aktif sebenarnya pada jaringan primer:
                </p>
                <div className={`p-3 rounded-xl border font-mono text-center text-sm ${
                  isDark ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  Pemakaian Aktual (kW) = (Watt / 1.000) × FK
                </div>
                <div className="mt-3 space-y-1 text-slate-400">
                  <div>• <strong>Faktor Kali (FK)</strong> = Rasio Transformator Arus (CT) × Rasio Transformator Tegangan (PT)</div>
                  <div>• Pengukuran Langsung TR (Daya ≤ 33 kVA): FK = 1</div>
                  <div>• Pengukuran Tidak Langsung TR (CT 100/5A): FK = 20</div>
                  <div>• Pengukuran TM (PT 20kV / 100V = 200, CT 50/5A = 10): FK = 200 × 10 = 2.000</div>
                </div>
              </div>

              {/* Rumus Segitiga Daya */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4" />
                  <span>2. Segitiga Daya Listrik AC 3-Fasa Seimbang</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-emerald-400">Daya Aktif (P)</div>
                    <div className="text-xs mt-1">P = √3 × V × I × Cos φ</div>
                    <div className="text-[10px] text-slate-400 mt-1">Satuan: Watt / kW</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-amber-400">Daya Reaktif (Q)</div>
                    <div className="text-xs mt-1">Q = √3 × V × I × Sin φ</div>
                    <div className="text-[10px] text-slate-400 mt-1">Satuan: VAR / kVAR</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-cyan-400">Daya Semu (S)</div>
                    <div className="text-xs mt-1">S = √3 × V × I = √(P² + Q²)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Satuan: VA / kVA</div>
                  </div>
                </div>
              </div>

              {/* Ketidakseimbangan Beban (Unbalance IEEE) */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" />
                  <span>3. Perhitungan Ketidakseimbangan Fasa (Unbalance IEEE/NEMA)</span>
                </h4>
                <p className={`mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ketidakseimbangan tegangan atau arus dihitung berdasarkan deviasi nilai fasa terhadap rata-rata:
                </p>
                <div className={`p-2.5 rounded-xl border font-mono text-center text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}>
                  % Unbalance = [ Max(|X_phase - X_avg|) / X_avg ] × 100%
                </div>
                <div className="mt-2 text-slate-400 text-[11px]">
                  Batas kritis ketidakseimbangan tegangan adalah &gt; 3%, dan ketidakseimbangan arus adalah &gt; 25% (berpotensi memicu arus netral $I_N$ tinggi dan pemanasan trafo).
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN DIAGRAM FASOR & POLARITAS */}
          {activeTab === 'phasor' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Kuadran Polar Fasor */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4" />
                  <span>Interpretasi Kuadran Polar Diagram Fasor</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Kuadran I (0° s.d. 90° Lagging) — NORMAL INDUKTIF</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Arus tertinggal terhadap tegangan (beban motor, trafo, induktor). Daya aktif $P &gt; 0$, Daya reaktif $Q &gt; 0$. Kondisi normal operasional pelanggan.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Kuadran II (90° s.d. 180°) — CT TERBALIK INDUKTIF</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Arah vektor arus berbalik $180^\circ$ akibat kabel polaritas sekunder CT (K-L / S1-S2) tertukar. Daya aktif terukur bernilai <strong>negatif ($P &lt; 0$)</strong>.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Kuadran III (180° s.d. 270°) — CT TERBALIK KAPASITIF</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Vektor arus berbalik dengan beban kapasitif. Daya aktif negatif ($P &lt; 0$) dan Daya reaktif negatif ($Q &lt; 0$). Sangat merugikan kWh susut PLN.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Kuadran IV (270° s.d. 360° Leading) — KAPASITIF</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Arus mendahului tegangan. Daya aktif positif ($P &gt; 0$), Daya reaktif negatif ($Q &lt; 0$). Terjadi saat bank kapasitor pelanggan over-kompensasi saat beban rendah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabel Diagnostik Cepat */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-amber-400 mb-2">Tabel Gejala & Tindak Lanjut Lapangan Petugas</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse font-sans">
                    <thead>
                      <tr className={isDark ? 'border-b border-slate-800 text-slate-400' : 'border-b border-slate-300 text-slate-600'}>
                        <th className="py-2 px-2">Gejala Vektor Fasor</th>
                        <th className="py-2 px-2">Kategori Masalah</th>
                        <th className="py-2 px-2">Saran Tindak Lanjut Petugas</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                      <tr>
                        <td className="py-2.5 px-2 font-mono font-bold text-rose-400">IR bergeser ~180° dari VR (P1 &lt; 0)</td>
                        <td className="py-2.5 px-2">CT Fasa R Terbalik</td>
                        <td className="py-2.5 px-2">Tukar terminal k-l kabel arus sekunder CT fasa R pada terminal meter atau trafo arus.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 font-mono font-bold text-amber-400">Sudut V-I &gt; 31,8° (Cos φ &lt; 0,85)</td>
                        <td className="py-2.5 px-2">Cosphi Rendah / Denda kVARh</td>
                        <td className="py-2.5 px-2">Verifikasi kerja automatic power factor controller (APFC) dan kapasitor bank pelanggan.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 font-mono font-bold text-amber-400">Sudut antar tegangan ≠ 120°</td>
                        <td className="py-2.5 px-2">Pergeseran Sudut Fasa Tegangan</td>
                        <td className="py-2.5 px-2">Cek sambungan sadapan trafo distribusi dan netral jaringan TM/TR.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 font-mono font-bold text-rose-400">Tegangan satu fasa = 0V</td>
                        <td className="py-2.5 px-2">Tegangan Fasa Hilang</td>
                        <td className="py-2.5 px-2">Periksa fuse pengaman tegangan meter atau sekring pelebur trafo sisi primer.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PEDOMAN INVESTIGASI P2TL */}
          {activeTab === 'p2tl' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-rose-400 mb-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Perdir Direksi PT PLN (Persero) No. 028.P/DIR/2023 — Penertiban Pemakaian Tenaga Listrik (P2TL)</span>
                </div>
                <p className={`mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tim Penertiban Pemakaian Tenaga Listrik (P2TL) menggunakan data AMR sebagai <em>Early Warning System</em> untuk mendeteksi indikasi anomali pengukuran:
                </p>
                <div className="space-y-2.5">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-rose-400 block">Pelanggaran Golongan II (P2) — Mempengaruhi Pengukuran Energi:</strong>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Pembalikan polaritas CT (kabel k-l tertukar), hubung singkat sekunder CT, pergeseran sudut fasa tegangan artificial, atau jumper kawat pada APP. Sanksi: Penerbitan Berita Acara (BA) dan penagihan Tagihan Susulan (TS).
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <strong className="text-amber-400 block">SOP Pemeriksaan Lapangan oleh Petugas:</strong>
                    <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px] mt-1">
                      <li>Bandingkan diagram fasor pada AMR PowerEye dengan pembacaan alat ukur standar lapangan (Phase Angle Meter / Calmet).</li>
                      <li>Periksa segel tera Metrologi dan segel PLN pada tutup terminal meter.</li>
                      <li>Uji arah putaran dan polaritas CT menggunakan tang amper dan volt meter.</li>
                      <li>Jika terbukti terbalik tanpa unsur kesengajaan teknis, lakukan perbaikan pengawatan dan buat Berita Acara Hasil Uji.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standar berlaku: SPLN D3.022-1:2012 • PUIL 2020 • Permen ESDM No. 28/2016</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shadow-emerald-900/30"
          >
            Tutup Rujukan
          </button>
        </div>
      </div>
    </div>
  );
};
