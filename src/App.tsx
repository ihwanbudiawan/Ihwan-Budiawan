import React, { useState, useEffect } from 'react';
import { AMRRecord, AppNotification, UserProfile } from './types/amr';
import { parseCsvContent, deduplicateSameDayCustomerRecords } from './utils/amrParser';
import { Header } from './components/Header';
import { DiagnosticSummary } from './components/DiagnosticSummary';
import { PhasorDiagram } from './components/PhasorDiagram';
import { ConsumptionCharts } from './components/ConsumptionCharts';
import { CustomerTable } from './components/CustomerTable';
import { DataUploader } from './components/DataUploader';
import { DashboardPredictiveModel } from './components/DashboardPredictiveModel';
import { LoginModal, getRegisteredUsers, saveRegisteredUsers } from './components/LoginModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { StandardsTheoryModal } from './components/StandardsTheoryModal';
import { playAlertChime } from './utils/notificationService';
import { printBeritaAcaraP2TL } from './utils/reportExporter';
import { useTheme } from './context/ThemeContext';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  FileSpreadsheet,
  Download,
  CheckCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Bell,
  BookOpen
} from 'lucide-react';
import { downloadAMRTemplate, exportAnomaliesToExcel } from './utils/excelTemplate';
import { PLNDistributionBackground } from './components/PLNDistributionBackground';
import { SidebarNav } from './components/SidebarNav';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { LoadProfileModal } from './components/LoadProfileModal';
import { CustomerSearchModal } from './components/CustomerSearchModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';

export default function App() {
  const { theme, isDark } = useTheme();
  const [records, setRecords] = useState<AMRRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AMRRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'phasor' | 'charts' | 'upload'>('dashboard');

  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('amr_powereye_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      id: 'user-ihwan',
      name: 'Ihwan Budiawan',
      email: 'ihwan.budiawan@gmail.com',
      role: 'admin',
      unit: 'UP3 Kudus - UID Jawa Tengah & DIY',
      avatarBg: 'bg-emerald-600',
    };
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchMode, setCustomerSearchMode] = useState<'phasor' | 'trend'>('phasor');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoadProfileModalOpen, setIsLoadProfileModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalTab, setDetailModalTab] = useState<'phasor' | 'trend' | 'profile'>('phasor');
  const [detailModalSplit, setDetailModalSplit] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'info',
      title: 'Selamat Datang di AMR PowerEye',
      message: 'Sistem siap menganalisis data pembacaan meter otomatis, mendeteksi ketidakseimbangan, cosphi, dan pembalikan polaritas CT.',
      read: false,
    }
  ]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Auto-load sample real dataset on start
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/assets/aistudio/52_INSTANT_20261013_9efcaeef.csv');
        if (res.ok) {
          const csvText = await res.text();
          // Load 1,500 initial records for fast initial render
          const parsed = parseCsvContent(csvText, 1500);
          // Deduplikasi record pelanggan ganda pada tanggal yang sama (ambil arus terbesar)
          const { deduplicatedRecords } = deduplicateSameDayCustomerRecords(parsed);
          if (deduplicatedRecords.length > 0) {
            setRecords(deduplicatedRecords);
            
            // Pilih satu pelanggan yang memiliki anomali wiring terbalik atau cosphi rendah agar langsung menarik
            const reverseAnomaly = deduplicatedRecords.find(r => r.anomalies.some(a => a.category === 'wiring_reverse'));
            const lowCosphiAnomaly = deduplicatedRecords.find(r => r.anomalies.some(a => a.category === 'cosphi_low'));
            setSelectedRecord(reverseAnomaly || lowCosphiAnomaly || deduplicatedRecords[0]);

            // Add critical anomaly notifications if found
            const criticals = deduplicatedRecords.filter(r => r.anomalies.some(a => a.severity === 'critical'));
            if (criticals.length > 0) {
              setNotifications(prev => [
                {
                  id: `crit-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString('id-ID'),
                  type: 'error',
                  title: `${criticals.length} Anomali Kritis Terdeteksi!`,
                  message: `Ditemukan kasus CT terbalik / daya aktif fasa negatif pada ${criticals[0].namaPelanggan} dan lainnya.`,
                  read: false,
                  relatedIdpel: criticals[0].locationCode,
                },
                ...prev,
              ]);
            }
          }
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Toast notification state
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  // Helper to trigger interactive toast alert
  const showToast = (notif: AppNotification) => {
    setToastNotification(notif);
    setTimeout(() => {
      setToastNotification(current => (current?.id === notif.id ? null : current));
    }, 7000);
  };

  const handleUpdateUserPhoto = (photoDataUrl: string) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = { ...currentUser, avatarUrl: photoDataUrl };
    setCurrentUser(updatedUser);
    localStorage.setItem('amr_powereye_user', JSON.stringify(updatedUser));

    try {
      const currentUsers = getRegisteredUsers();
      const updatedList = currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
      saveRegisteredUsers(updatedList);
    } catch (e) {
      /* ignore */
    }

    showToast({
      id: `photo-upd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'success',
      severity: 'info',
      title: 'Foto Profil Diperbarui',
      message: 'Foto profil akun Anda telah diperbarui dan disimpan.',
      read: true,
    });
  };

  const handleDataLoaded = (newRecords: AMRRecord[], fileName: string, summaries?: any) => {
    // Terapkan deduplikasi hari sama: bila idpel sama di tanggal yang sama, simpan yang arusnya terbesar
    const { deduplicatedRecords, removedCount: removedDuplicatesCount } = deduplicateSameDayCustomerRecords(newRecords);

    setRecords(deduplicatedRecords);
    if (deduplicatedRecords.length > 0) {
      const interestingRecord = deduplicatedRecords.find(r => r.anomalies.length > 0) || deduplicatedRecords[0];
      setSelectedRecord(interestingRecord);
    }

    const criticalList = deduplicatedRecords.filter(r => r.anomalies.some(a => a.severity === 'critical'));
    const warningList = deduplicatedRecords.filter(r => r.anomalies.some(a => a.severity === 'warning'));
    const reverseList = deduplicatedRecords.filter(r => r.anomalies.some(a => a.category === 'wiring_reverse'));
    const voltageAbnormalList = deduplicatedRecords.filter(r => r.anomalies.some(a => a.category.startsWith('voltage')));
    const lowCosphiList = deduplicatedRecords.filter(r => r.anomalies.some(a => a.category.startsWith('cosphi')));

    if (criticalList.length > 0 && soundEnabled) {
      playAlertChime('critical');
    } else if (warningList.length > 0 && soundEnabled) {
      playAlertChime('warning');
    }

    const userName = currentUser?.name || 'Petugas';
    const nowTime = new Date().toLocaleTimeString('id-ID');

    // Create detailed, targeted notification items for key detected anomalies
    const generatedNotifs: AppNotification[] = [];

    // 0. Deduplication notice if same-day duplicates were detected
    if (removedDuplicatesCount > 0) {
      generatedNotifs.push({
        id: `dedup-${Date.now()}`,
        timestamp: nowTime,
        type: 'info',
        severity: 'info',
        title: `Deduplikasi Hari Sama: ${removedDuplicatesCount} Data Ganda Dihapus`,
        message: `Terdapat ${removedDuplicatesCount} data ID Pelanggan ganda pada tanggal yang sama. Sesuai aturan analisa, data dengan arus terkecil dihapus dan hanya data dengan arus beban terbesar yang dipertahankan.`,
        read: false,
      });
    }

    // 1. General upload summary notification
    generatedNotifs.push({
      id: `upload-${Date.now()}`,
      timestamp: nowTime,
      type: criticalList.length > 0 ? 'error' : 'success',
      severity: criticalList.length > 0 ? 'critical' : 'info',
      title: criticalList.length > 0 
        ? `Perhatian ${userName}: ${criticalList.length} Anomali Kritis Ditemukan!` 
        : `Data Berhasil Dianalisis: ${fileName}`,
      message: `${deduplicatedRecords.length.toLocaleString('id-ID')} data diproses dari ${fileName}${removedDuplicatesCount > 0 ? ` (${removedDuplicatesCount} data ganda hari sama dieliminasi)` : ''}. Terdeteksi ${reverseList.length} kasus CT terbalik, ${voltageAbnormalList.length} anomali tegangan, dan ${lowCosphiList.length} cosphi rendah.`,
      read: false,
    });

    // 2. Specific notifications for reverse CT cases (up to top 3)
    reverseList.slice(0, 3).forEach((r, idx) => {
      const revAnom = r.anomalies.find(a => a.category === 'wiring_reverse');
      generatedNotifs.push({
        id: `rev-${r.locationCode}-${Date.now()}-${idx}`,
        timestamp: nowTime,
        type: 'error',
        severity: 'critical',
        category: 'wiring_reverse',
        title: `Wiring CT Terbalik: ${r.namaPelanggan}`,
        message: `Ditemukan arah arus berbalik pada Fasa ${revAnom?.affectedPhase || 'R'} dengan daya negatif (${r.activePowerTotal.toFixed(0)} W). Berpotensi merugikan kWh susut!`,
        customerName: r.namaPelanggan,
        relatedIdpel: r.locationCode,
        affectedPhase: revAnom?.affectedPhase || 'R',
        value: revAnom?.value || `${r.activePowerTotal.toFixed(0)} W`,
        recommendation: revAnom?.recommendation || 'Tukar polaritas kabel arus sekunder CT (K-L) pada terminal meter.',
        read: false,
      });
    });

    // 3. Specific notifications for voltage out-of-bounds (up to top 2)
    voltageAbnormalList.slice(0, 2).forEach((r, idx) => {
      const vAnom = r.anomalies.find(a => a.category.startsWith('voltage'));
      if (vAnom) {
        generatedNotifs.push({
          id: `volt-${r.locationCode}-${Date.now()}-${idx}`,
          timestamp: nowTime,
          type: vAnom.severity === 'critical' ? 'error' : 'warning',
          severity: vAnom.severity,
          category: vAnom.category,
          title: `${vAnom.title}: ${r.namaPelanggan}`,
          message: vAnom.description,
          customerName: r.namaPelanggan,
          relatedIdpel: r.locationCode,
          affectedPhase: vAnom.affectedPhase,
          value: vAnom.value,
          recommendation: vAnom.recommendation,
          read: false,
        });
      }
    });

    // 4. Specific notifications for low cosphi (up to top 2)
    lowCosphiList.slice(0, 2).forEach((r, idx) => {
      const cosAnom = r.anomalies.find(a => a.category.startsWith('cosphi'));
      if (cosAnom) {
        generatedNotifs.push({
          id: `cos-${r.locationCode}-${Date.now()}-${idx}`,
          timestamp: nowTime,
          type: 'warning',
          severity: 'warning',
          category: cosAnom.category,
          title: `Cos φ Rendah (${r.powerFactorTotal.toFixed(3)}): ${r.namaPelanggan}`,
          message: cosAnom.description,
          customerName: r.namaPelanggan,
          relatedIdpel: r.locationCode,
          value: `${r.powerFactorTotal.toFixed(3)} (< 0.85)`,
          recommendation: cosAnom.recommendation,
          read: false,
        });
      }
    });

    setNotifications(prev => [...generatedNotifs, ...prev]);

    // Show floating in-app toast for immediate awareness
    if (criticalList.length > 0) {
      showToast(generatedNotifs[1] || generatedNotifs[0]);
    } else if (generatedNotifs.length > 0) {
      showToast(generatedNotifs[0]);
    }

    setActiveTab('dashboard');
  };

  const handleErrorNotification = (msg: string) => {
    const errorNotif: AppNotification = {
      id: `err-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'error',
      severity: 'critical',
      title: 'Kesalahan Validasi File / Data',
      message: msg,
      read: false,
    };
    setNotifications(prev => [errorNotif, ...prev]);
    showToast(errorNotif);
    setIsNotificationDrawerOpen(true);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('amr_powereye_user', JSON.stringify(user));
    setNotifications(prev => [
      {
        id: `login-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'info',
        title: 'Login Berhasil',
        message: `Masuk sebagai ${user.name} (${user.role.toUpperCase()}) - ${user.unit}`,
        read: false,
      },
      ...prev,
    ]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('amr_powereye_user');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = records.filter(r => r.anomalies.some(a => a.severity === 'critical')).length;
  const anomalousRecords = records.filter(r => r.anomalies.length > 0);

  // Selected customer history records for load profile
  const selectedHistory = selectedRecord 
    ? records.filter(r => r.locationCode === selectedRecord.locationCode || r.assetMeterCode === selectedRecord.assetMeterCode)
    : [];


  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-x-clip transition-colors duration-200 ${
        isDark
          ? 'bg-gradient-to-b from-[#0e2c21] via-[#0b241b] to-[#071d15] text-slate-100 selection:bg-emerald-500 selection:text-slate-950'
          : 'bg-gradient-to-b from-slate-50 via-emerald-50/25 to-teal-50/30 text-slate-900 selection:bg-emerald-200 selection:text-emerald-950'
      }`}
    >
      {/* Background PLN Distribusi: Sustainable Green Energy Aura & Siluet Jaringan Distribusi */}
      <PLNDistributionBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        notificationCount={unreadCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
        onUpdateAvatar={handleUpdateUserPhoto}
        selectedCustomerName={selectedRecord?.namaPelanggan}
        totalRecords={records.length}
        criticalCount={criticalCount}
      />

      {/* Left Sidebar Navigation */}
      <SidebarNav
        currentTab={activeTab}
        onNavigateTab={setActiveTab}
        currentUser={currentUser}
        onOpenUserModal={() => setIsLoginModalOpen(true)}
        onOpenPhasorSearch={() => {
          setCustomerSearchMode('phasor');
          setIsCustomerSearchOpen(true);
        }}
        onOpenTrendSearch={() => {
          setCustomerSearchMode('trend');
          setIsCustomerSearchOpen(true);
        }}
        onOpenImportInstant={() => setActiveTab('upload')}
        onOpenImportLoadProfile={() => setIsLoadProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
        onUpdateAvatar={handleUpdateUserPhoto}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pl-20 lg:pl-72 pb-36 transition-all duration-300">
        {/* TAB: DASHBOARD UTAMA */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Summary Cards */}
            <DiagnosticSummary
              records={records}
              onFilterClick={() => {
                // Keep on dashboard and scroll to table
                const tableElem = document.getElementById('customer-table-section');
                if (tableElem) tableElem.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Model Regresi Prediktif Anomali & Risiko Kerusakan Komponen Meter (12 Bulan Historis) */}
            <DashboardPredictiveModel
              records={records}
              onSelectCustomer={(rec) => {
                setSelectedRecord(rec);
                setActiveTab('phasor');
              }}
            />

            {/* Customer Table Section */}
            <div id="customer-table-section" className="scroll-mt-24">
              <CustomerTable
                records={records}
                selectedRecord={selectedRecord}
                onSelectRecord={(rec) => {
                  setSelectedRecord(rec);
                }}
                currentUser={currentUser}
              />
            </div>
          </div>
        )}

        {/* TAB: DIAGRAM FASOR KHUSUS */}
        {activeTab === 'phasor' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick customer selector strip */}
            <div
              className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    isDark
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}
                >
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pelanggan Aktif:</div>
                  <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedRecord?.namaPelanggan || 'Pilih Pelanggan'}
                  </div>
                </div>
              </div>

              {/* Anomaly presets for rapid testing */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Contoh Anomali Cepat:
                </span>
                {records.filter(r => r.anomalies.some(a => a.category === 'wiring_reverse')).slice(0, 2).map((r, i) => (
                  <button
                    key={`rev-${i}`}
                    onClick={() => setSelectedRecord(r)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-500 border border-rose-500/40 text-[11px] font-semibold hover:bg-rose-500/30 transition truncate max-w-[170px]"
                    title={r.namaPelanggan}
                  >
                    ⚡ CT Terbalik ({r.namaPelanggan.split(' ')[0]})
                  </button>
                ))}

                {records.filter(r => r.anomalies.some(a => a.category === 'cosphi_low')).slice(0, 2).map((r, i) => (
                  <button
                    key={`pf-${i}`}
                    onClick={() => setSelectedRecord(r)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[11px] font-semibold hover:bg-amber-500/30 transition truncate max-w-[170px]"
                    title={r.namaPelanggan}
                  >
                    📉 Cosphi Buruk ({r.namaPelanggan.split(' ')[0]})
                  </button>
                ))}

                {records.filter(r => r.anomalies.length === 0).slice(0, 1).map((r, i) => (
                  <button
                    key={`norm-${i}`}
                    onClick={() => setSelectedRecord(r)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 text-[11px] font-semibold hover:bg-emerald-500/30 transition truncate max-w-[150px]"
                    title={r.namaPelanggan}
                  >
                    ✅ Normal
                  </button>
                ))}
              </div>
            </div>

            {selectedRecord ? (
              <PhasorDiagram
                record={selectedRecord}
                allRecords={records}
                onExportBA={printBeritaAcaraP2TL}
              />
            ) : (
              <div
                className={`p-12 text-center rounded-2xl border ${
                  isDark ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-600 bg-white border-slate-200'
                }`}
              >
                Pilih pelanggan dari tabel untuk menampilkan diagram fasor.
              </div>
            )}
          </div>
        )}

        {/* TAB: GRAFIK PEMAKAIAN & BEBAN */}
        {activeTab === 'charts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Customer selector bar */}
            <div
              className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    isDark
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pelanggan Aktif:</div>
                  <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedRecord?.namaPelanggan || 'Pilih Pelanggan'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('phasor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                >
                  Bandingkan ke Fasor
                </button>
              </div>
            </div>

            {selectedRecord ? (
              <ConsumptionCharts
                currentRecord={selectedRecord}
                records={records}
                historyRecords={selectedHistory}
              />
            ) : (
              <div
                className={`p-12 text-center rounded-2xl border ${
                  isDark ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-600 bg-white border-slate-200'
                }`}
              >
                Pilih pelanggan dari tabel untuk menampilkan grafik beban.
              </div>
            )}
          </div>
        )}

        {/* TAB: INPUT DATA EXCEL & CSV */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DataUploader
              onDataLoaded={handleDataLoaded}
              onError={handleErrorNotification}
              totalLoaded={records.length}
              currentUser={currentUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* Format Instructions & Documentation */}
            <div
              className={`border rounded-2xl p-6 space-y-4 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Info className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-emerald-600'}`} />
                Panduan Analisis Anomali Pengukuran AMR PLN
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Wiring & CT Terbalik
                  </div>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Terjadi saat kabel arus sekunder CT (K-L) terpasang terbalik. Ditandai dengan{' '}
                    <strong>Daya Aktif fasa bernilai negatif (P &lt; 0)</strong> dan pergeseran sudut arus ~180°. Berpotensi mengurangi putaran kWh meter (kWh susut non-teknis).
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Faktor Daya (Cos φ) Rendah
                  </div>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Sesuai regulasi PLN, standar faktor daya adalah <strong>Cos φ ≥ 0.85</strong>. Nilai di bawah 0.85 menandakan beban induktif berlebih dan pelanggan dikenakan denda kelebihan pemakaian kVARh.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                    <RotateCw className="w-4 h-4 text-emerald-500" />
                    Anomali Tegangan & Arus
                  </div>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Mendeteksi fasa hilang (V=0 / Fuse PT putus), under-voltage &lt;198V, over-voltage &gt;245V, ketidakseimbangan beban, dan arus kawat netral tinggi akibat pembagian beban tidak simetris.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FROZEN (STICKY/FIXED) FOOTER & RUNNING TEXT MARQUEE - TIDAK BERGERAK SAAT SCROLL */}
      <div className="fixed bottom-0 left-0 right-0 z-30 shadow-2xl backdrop-blur-md">
        {/* RUNNING TEXT (TEXT BERJALAN) FOOTER ANOMALI PELANGGAN - KECEPATAN WAJAR (150s) */}
        {anomalousRecords.length > 0 && (
          <div
            className={`border-t border-b overflow-hidden py-2 px-3 text-xs select-none pl-20 lg:pl-72 transition-all duration-300 ${
              isDark
                ? 'bg-rose-950/85 border-rose-900/60 text-rose-200'
                : 'bg-rose-50/95 border-rose-200 text-rose-900'
            }`}
            title="Klik pada nama pelanggan anomali untuk langsung membuka analisa fasor & diagnostik"
          >
            <div className="flex items-center">
              {/* Static Badge Label */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] shrink-0 z-10 shadow-sm mr-3">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>TEMUAN ANOMALI ({anomalousRecords.length}):</span>
              </div>

              {/* Continuous Marquee Ticker */}
              <div className="overflow-hidden whitespace-nowrap flex-1">
                <div className="animate-marquee flex items-center gap-6">
                  {[...anomalousRecords, ...anomalousRecords].map((rec, idx) => (
                    <button
                      key={`${rec.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setDetailModalTab('phasor');
                        setDetailModalSplit(false);
                        setIsDetailModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 hover:underline cursor-pointer group text-left shrink-0"
                    >
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30">
                        {rec.locationCode}
                      </span>
                      <span className="font-bold">{rec.namaPelanggan}:</span>
                      <span className="opacity-90">
                        {rec.anomalies.map(a => `${a.title} (${a.affectedPhase ? `Fasa ${a.affectedPhase} - ` : ''}${a.description})`).join(' • ')}
                      </span>
                      <span className="text-rose-400 font-extrabold mx-2">⚡</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Frozen Footer */}
        <footer
          className={`border-t py-3 text-center text-xs pl-20 lg:pl-72 transition-all duration-300 ${
            isDark ? 'border-slate-800/80 bg-slate-950/90 text-slate-400' : 'border-slate-200 bg-white/95 text-slate-600'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              AMR PowerEye Diagnostic System • Kompatibel format WASION, Hexing, Edmi, Itron, Actaris
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsStandardsModalOpen(true)}
                className={`transition font-semibold flex items-center gap-1 ${
                  isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Rujukan Standar & Teori</span>
              </button>
              <span>•</span>
              <button
                onClick={downloadAMRTemplate}
                className={`transition font-semibold ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                Unduh Template Excel
              </button>
              <span>•</span>
              <span>Unit: UP3 Kudus - UID Jateng</span>
            </div>
          </div>
        </footer>
      </div>

      {/* FLOATING IN-APP TOAST ALERT (ANOMALY NOTIFICATION) - ELEVATED ABOVE FAB */}
      {toastNotification && (
        <div className="fixed bottom-24 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${
            toastNotification.severity === 'critical' || toastNotification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-white shadow-rose-950/50'
              : toastNotification.severity === 'warning' || toastNotification.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/50 text-white shadow-amber-950/50'
              : 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-950/50'
          }`}>
            <div className="mt-0.5">
              {toastNotification.severity === 'critical' || toastNotification.type === 'error' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              ) : toastNotification.severity === 'warning' || toastNotification.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">
                  {toastNotification.title}
                </span>
                <button
                  onClick={() => setToastNotification(null)}
                  className="text-slate-400 hover:text-white transition text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                {toastNotification.message}
              </p>
              {toastNotification.relatedIdpel && (
                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rec = records.find(r => r.locationCode === toastNotification.relatedIdpel);
                      if (rec) {
                        setSelectedRecord(rec);
                        setActiveTab('phasor');
                      }
                      setToastNotification(null);
                    }}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold text-white transition flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Lihat Fasor ({toastNotification.relatedIdpel})</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsNotificationDrawerOpen(true);
                      setToastNotification(null);
                    }}
                    className="text-[10px] text-slate-300 hover:text-white underline"
                  >
                    Semua Peringatan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) NOTIFIKASI DI POJOK KANAN BAWAH DENGAN UKURAN LEBIH BESAR */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className={`relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300 transform active:scale-95 ${
            criticalCount > 0
              ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-rose-950/60 ring-4 ring-rose-500/30 hover:scale-105'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-emerald-950/60 ring-4 ring-emerald-500/25 hover:scale-105 hover:shadow-cyan-500/30'
          } text-white`}
          title={`Pusat Notifikasi & Peringatan AMR (${unreadCount} belum dibaca)`}
          aria-label="Pusat Notifikasi & Peringatan AMR"
        >
          {/* Subtle pulse / ping aura for critical anomalies */}
          {criticalCount > 0 && (
            <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-rose-500 animate-ping opacity-35" />
          )}

          <Bell className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:rotate-12 duration-200" />

          {/* Badge Unread Count */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1.5 rounded-full font-black text-xs flex items-center justify-center border-2 shadow-lg transition-transform ${
                isDark ? 'border-slate-900' : 'border-white'
              } ${
                criticalCount > 0
                  ? 'bg-rose-600 text-white animate-bounce'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Floating Tooltip Label on Hover */}
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl border border-slate-700/60 hidden sm:block">
            Pusat Notifikasi AMR ({unreadCount})
          </span>
        </button>
      </div>

      {/* Modals & Drawers */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      <StandardsTheoryModal
        isOpen={isStandardsModalOpen}
        onClose={() => setIsStandardsModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onSelectIdpel={(idpel) => {
          const rec = records.find(r => r.locationCode === idpel);
          if (rec) {
            setSelectedRecord(rec);
            setActiveTab('phasor');
          }
        }}
        currentUser={currentUser}
        criticalRecords={records.filter(r => r.anomalies.some(a => a.severity === 'critical'))}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Customer Quick Search Modal for Phasor & Trend */}
      <CustomerSearchModal
        isOpen={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        allRecords={records}
        mode={customerSearchMode}
        onSelectCustomer={(rec, openSplitMode) => {
          setSelectedRecord(rec);
          setDetailModalTab(customerSearchMode === 'phasor' ? 'phasor' : 'trend');
          setDetailModalSplit(openSplitMode || false);
          setIsDetailModalOpen(true);
        }}
      />

      {/* Settings Modal (Theme, Background, Notification Sounds) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Export Modal (Excel, CSV, Berita Acara P2TL) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
        selectedRecord={selectedRecord}
      />

      {/* Load Profile Import Modal */}
      <LoadProfileModal
        isOpen={isLoadProfileModalOpen}
        onClose={() => setIsLoadProfileModalOpen(false)}
        onLoaded={(fileName, count) => {
          showToast({
            id: `lp-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            type: 'success',
            severity: 'info',
            title: 'Load Profile Berhasil Dimuat',
            message: `Memuat ${count} data rekaman berkala dari file ${fileName}.`,
            read: true,
          });
        }}
      />

      {/* Customer Detail & Investigation Modal (Phasor split screen, Trends, 12 Month Profile) */}
      {isDetailModalOpen && selectedRecord && (
        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          record={selectedRecord}
          allRecords={records}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
          initialTab={detailModalTab}
          initialSplitMode={detailModalSplit}
        />
      )}
      </div>
    </div>
  );
}

