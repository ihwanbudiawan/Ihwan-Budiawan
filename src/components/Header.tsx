import React, { useRef } from 'react';
import { UserProfile } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import {
  Zap,
  RotateCw,
  TrendingUp,
  FileSpreadsheet,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Camera,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'phasor' | 'charts' | 'upload';
  onTabChange: (tab: 'dashboard' | 'phasor' | 'charts' | 'upload') => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenStandards?: () => void;
  onUpdateAvatar?: (avatarDataUrl: string) => void;
  selectedCustomerName?: string;
  totalRecords: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenLogin,
  onLogout,
  notificationCount,
  onOpenNotifications,
  onOpenStandards,
  onUpdateAvatar,
  selectedCustomerName,
  totalRecords,
  criticalCount,
}) => {
  const { theme, isDark, setTheme } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (onUpdateAvatar) {
            onUpdateAvatar(compressedDataUrl);
          }
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md transition-colors duration-200 border-b ${
          isDark
            ? 'bg-slate-950/90 border-emerald-500/20 shadow-lg shadow-emerald-950/20 text-white'
            : 'bg-white/95 border-slate-200/90 shadow-sm shadow-slate-200/60 text-slate-900'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-extrabold text-base tracking-tight flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  PLN <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>PowerEye</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hidden sm:inline">
                  UP3 KUDUS
                </span>
              </div>
              <div className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sistem Pemantauan AMR &amp; Analisis Diagnostik Pengawatan Meter
              </div>
            </div>
          </div>

          {/* Hidden File Input for Avatar Photo Upload */}
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelected}
            accept="image/*"
            className="hidden"
          />

          {/* Right Action Cluster: Hanya Tombol Gelap/Terang yang memiliki border */}
          <div className="flex items-center gap-3">
            {/* Pilihan Tampilan Enviroment (Gelap / Terang) - SATU-SATUNYA YANG MEMILIKI BORDER */}
            <div
              className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700/80 text-slate-400'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
              title="Pilihan Tampilan Enviroment: Gelap (Dark Mode) atau Terang (Light Mode)"
            >
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs border-0 ${
                  isDark
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
                title="Aktifkan Enviroment Mode Gelap (PLN Dark Grid)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gelap</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs border-0 ${
                  !isDark
                    ? 'bg-white text-emerald-700 font-bold shadow-sm'
                    : 'hover:text-white text-slate-400'
                }`}
                title="Aktifkan Enviroment Mode Terang (Clean Light)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Terang</span>
              </button>
            </div>

            {/* User Profile / Photo Avatar / Login */}
            {currentUser ? (
              <div
                className={`flex items-center gap-2.5 pl-2 border-l ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                {/* User Avatar (Photo or Initials) with Camera Overlay to change photo */}
                <div className="relative group">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-400 shadow cursor-pointer hover:opacity-90 transition"
                      title="Klik untuk mengganti foto profil"
                    />
                  ) : (
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className={`w-8 h-8 rounded-xl ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow cursor-pointer hover:ring-2 hover:ring-emerald-400 transition`}
                      title="Klik untuk mengunggah foto profil"
                    >
                      {currentUser.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Camera Icon Overlay on Hover */}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    type="button"
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md border border-white dark:border-slate-900 transition-transform group-hover:scale-110"
                    title="Ganti Foto Profil"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="hidden sm:block text-left text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          : currentUser.role === 'p2tl'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : currentUser.role === 'supervisor'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                          : currentUser.role === 'analyst'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate max-w-[140px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentUser.unit.split('-')[0]}
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className={`p-1.5 rounded-lg transition ${
                    isDark
                      ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-100'
                  }`}
                  title="Ganti Pengguna / Tambah Akun"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogout}
                  className={`p-1.5 rounded-lg transition ${
                    isDark
                      ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login Petugas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* Spacer so the page content flows below the fixed header */}
    <div className="h-16 w-full shrink-0" aria-hidden="true" />
  </>
  );
};
