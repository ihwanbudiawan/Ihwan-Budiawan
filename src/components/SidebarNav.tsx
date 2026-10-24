import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserProfile } from '../types/amr';
import {
  LayoutDashboard,
  RotateCw,
  TrendingUp,
  FileSpreadsheet,
  FileDown,
  Settings,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  BookOpen,
  Download,
  UploadCloud,
  Database,
  Camera,
} from 'lucide-react';

interface SidebarNavProps {
  currentTab: 'dashboard' | 'phasor' | 'charts' | 'upload';
  onNavigateTab: (tab: 'dashboard' | 'phasor' | 'charts' | 'upload') => void;
  currentUser: UserProfile | null;
  onOpenUserModal: () => void;
  onOpenPhasorSearch: () => void;
  onOpenTrendSearch: () => void;
  onOpenImportInstant: () => void;
  onOpenImportLoadProfile: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenStandards?: () => void;
  onUpdateAvatar?: (dataUrl: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentTab,
  onNavigateTab,
  currentUser,
  onOpenUserModal,
  onOpenPhasorSearch,
  onOpenTrendSearch,
  onOpenImportInstant,
  onOpenImportLoadProfile,
  onOpenSettings,
  onOpenExport,
  onOpenStandards,
  onUpdateAvatar,
}) => {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'user',
      label: 'User & Profil',
      subLabel: 'Edit profil & tambah user',
      icon: Users,
      onClick: onOpenUserModal,
      active: false,
      color: 'text-purple-400',
      badge: currentUser?.role || 'Admin',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      subLabel: 'Ringkasan & data pelanggan',
      icon: LayoutDashboard,
      onClick: () => onNavigateTab('dashboard'),
      active: currentTab === 'dashboard',
      color: 'text-emerald-400',
    },
    {
      id: 'phasor',
      label: 'Diagram Fasor',
      subLabel: 'Input IDPEL & split screen',
      icon: RotateCw,
      onClick: onOpenPhasorSearch,
      active: currentTab === 'phasor',
      color: 'text-cyan-400',
    },
    {
      id: 'trend',
      label: 'Grafik & Tren',
      subLabel: 'Input IDPEL, V/I/Cos φ',
      icon: TrendingUp,
      onClick: onOpenTrendSearch,
      active: currentTab === 'charts',
      color: 'text-blue-400',
    },
    {
      id: 'import-instant',
      label: 'Import Data Instant',
      subLabel: 'Upload CSV/Excel instan',
      icon: UploadCloud,
      onClick: onOpenImportInstant,
      active: currentTab === 'upload',
      color: 'text-teal-400',
    },
    {
      id: 'import-profile',
      label: 'Import Load Profile',
      subLabel: 'Interval 15/30 menit',
      icon: Database,
      onClick: onOpenImportLoadProfile,
      active: false,
      color: 'text-indigo-400',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      subLabel: 'Tema, background, audio',
      icon: Settings,
      onClick: onOpenSettings,
      active: false,
      color: 'text-amber-400',
    },
    {
      id: 'export',
      label: 'Eksport Analisa',
      subLabel: 'Excel, CSV, BA P2TL',
      icon: Download,
      onClick: onOpenExport,
      active: false,
      color: 'text-rose-400',
    },
  ];

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 z-30 transition-all duration-300 border-r flex flex-col justify-between ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isDark
          ? 'bg-slate-950/95 border-slate-800/80 shadow-2xl shadow-emerald-950/20 text-slate-200'
          : 'bg-white/95 border-slate-200/90 shadow-lg text-slate-800'
      } backdrop-blur-md select-none`}
    >
      {/* Top Section: App info & Collapse button */}
      <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Menu Navigasi
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-xl border transition ${
            isCollapsed ? 'mx-auto' : ''
          } ${
            isDark
              ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white'
              : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
        {/* Large User Photo Section - Requirement: "di sidebar diatas user ada foto user dengan ukuran yg besar" */}
        {!isCollapsed ? (
          <div
            className={`p-3.5 mb-2 rounded-2xl border text-center transition-all ${
              isDark
                ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/80 border-slate-800 shadow-md'
                : 'bg-gradient-to-b from-emerald-50/70 to-slate-50 border-emerald-100 shadow-xs'
            }`}
          >
            <div className="relative inline-block mx-auto mb-2.5 group">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  onClick={onOpenUserModal}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-emerald-500/40 shadow-xl mx-auto cursor-pointer hover:opacity-95 transition"
                />
              ) : (
                <div
                  onClick={onOpenUserModal}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-xl ring-4 ring-emerald-500/40 mx-auto cursor-pointer hover:brightness-110 transition"
                >
                  {currentUser?.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'PLN'}
                </div>
              )}

              {/* Quick Upload Camera Trigger */}
              <label
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg transition hover:scale-105"
                title="Ganti Foto Profil Petugas"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === 'string') {
                        onUpdateAvatar?.(ev.target.result);
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>

              {/* Green Online Dot */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </div>

            <div className="truncate">
              <h4
                onClick={onOpenUserModal}
                className={`font-bold text-xs truncate cursor-pointer hover:underline ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                title={currentUser?.name || 'Petugas AMR PLN'}
              >
                {currentUser?.name || 'Ihwan Budiawan'}
              </h4>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
              <p
                className={`text-[10px] truncate mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {currentUser?.unit || 'UP3 Kudus • UID Jateng'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-1 mb-2 text-center">
            <div
              onClick={onOpenUserModal}
              className="w-10 h-10 rounded-xl bg-emerald-600/30 ring-2 ring-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300 mx-auto cursor-pointer"
              title={currentUser?.name || 'Profil Petugas'}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                (currentUser?.name || 'IB').slice(0, 2).toUpperCase()
              )}
            </div>
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl font-semibold text-xs transition text-left group relative ${
                item.active
                  ? isDark
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
                  : isDark
                  ? 'hover:bg-slate-900/80 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                  item.active
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : isDark
                    ? 'bg-slate-900/90 group-hover:bg-slate-800 text-slate-300'
                    : 'bg-slate-100 group-hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-white' : item.color}`} />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.subLabel}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Footer: Standar & Teori Quick Link */}
      <div className="p-3 border-t border-slate-800/60">
        {onOpenStandards && (
          <button
            onClick={onOpenStandards}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold transition ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Lihat Referensi Standar PLN, IEC, IEEE, ANSI, ISO"
          >
            <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
            {!isCollapsed && (
              <div className="text-left leading-tight truncate">
                <span className="font-bold block">Standar &amp; Teori</span>
                <span className="text-[10px] text-slate-400 font-mono">SPLN • IEC • IEEE</span>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
