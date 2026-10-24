import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ROLE_PERMISSIONS, PLN_AVAILABLE_UNITS, PLNUnitType } from '../types/amr';
import {
  User,
  Lock,
  Shield,
  Check,
  X,
  LogIn,
  UserPlus,
  Building,
  Key,
  ShieldAlert,
  ShieldCheck,
  Users,
  Camera,
  Upload
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export const INITIAL_REGISTERED_USERS: UserProfile[] = [
  {
    id: 'user-ihwan',
    name: 'Ihwan Budiawan',
    email: 'ihwan.budiawan@gmail.com',
    role: 'admin',
    unit: 'UP3 Kudus (Semua ULP)',
    avatarBg: 'bg-emerald-600',
    createdAt: '2026-10-13',
  },
  {
    id: 'user-bambang',
    name: 'Bambang S. (Tim P2TL)',
    email: 'p2tl.kudus@pln.co.id',
    role: 'p2tl',
    unit: 'ULP Kudus Kota',
    avatarBg: 'bg-rose-600',
    createdAt: '2026-10-13',
  },
  {
    id: 'user-siti',
    name: 'Siti Rahma, S.T.',
    email: 'spv.amr@pln.co.id',
    role: 'supervisor',
    unit: 'ULP Pati',
    avatarBg: 'bg-indigo-600',
    createdAt: '2026-10-13',
  },
  {
    id: 'user-analyst',
    name: 'Rian Pratama',
    email: 'rian.analyst@pln.co.id',
    role: 'analyst',
    unit: 'ULP Jepara',
    avatarBg: 'bg-cyan-600',
    createdAt: '2026-10-14',
  },
  {
    id: 'user-viewer',
    name: 'Pengamat Magang',
    email: 'viewer.tamu@pln.co.id',
    role: 'viewer',
    unit: 'ULP Rembang',
    avatarBg: 'bg-slate-600',
    createdAt: '2026-10-15',
  },
];

const STORAGE_USERS_KEY = 'amr_powereye_registered_users_v2';

export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    /* ignore */
  }
  return INITIAL_REGISTERED_USERS;
}

export function saveRegisteredUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users', e);
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Login form state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('user-ihwan');
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('analyst');
  const [regUnit, setRegUnit] = useState('ULP Kudus Kota');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');
  const [regError, setRegError] = useState('');

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
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setRegAvatarUrl(compressed);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    setUsers(getRegisteredUsers());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customEmail) {
      // Find matching user or create on-the-fly
      const existing = users.find(u => u.email.toLowerCase() === customEmail.toLowerCase());
      if (existing) {
        onLogin(existing);
      } else {
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          name: customEmail.split('@')[0],
          email: customEmail,
          role: 'analyst',
          unit: 'UP3 Kudus',
          avatarBg: 'bg-cyan-600',
        };
        const updated = [...users, newUser];
        setUsers(updated);
        saveRegisteredUsers(updated);
        onLogin(newUser);
      }
    } else {
      const selected = users.find(u => u.id === selectedPresetId) || users[0];
      onLogin(selected);
    }
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Mohon isi semua field wajib.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === regEmail.toLowerCase())) {
      setRegError('Email ini sudah terdaftar. Silakan login langsung.');
      return;
    }

    const colorList = ['bg-emerald-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
    const randomBg = colorList[Math.floor(Math.random() * colorList.length)];

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      unit: regUnit.trim() || 'UP3 Kudus',
      avatarBg: randomBg,
      avatarUrl: regAvatarUrl || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    saveRegisteredUsers(updated);

    onLogin(newUser);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
      isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
    }`}>
      <div className={`relative w-[96vw] max-w-4xl h-[92vh] max-h-[94vh] rounded-3xl p-6 shadow-2xl border flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border mb-2 ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sistem Autentikasi AMR PLN</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manajemen hak akses pengguna dan kontrol peran (Role-Based Access Control)
          </p>
        </div>

        {/* Tab Switcher: Login vs Registrasi */}
        <div className={`flex p-1 rounded-2xl border text-xs mb-5 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-cyan-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Pilih Akun</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-cyan-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Pengguna Baru</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1.5 space-y-4">
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <div className="space-y-4">
            <div className={`text-xs font-semibold flex items-center justify-between ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <span>Pilih Akun Petugas Terdaftar:</span>
              <span className={`text-[11px] font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {users.length} Akun Aktif
              </span>
            </div>

            {/* Quick User Radio List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = selectedPresetId === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedPresetId(u.id);
                      setCustomEmail('');
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? isDark
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-sm ring-1 ring-cyan-500/50'
                          : 'bg-cyan-50/90 border-cyan-400 shadow-sm ring-1 ring-cyan-400/60'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-cyan-500/50 shadow"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl ${u.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow`}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className={`text-xs font-bold flex items-center gap-2 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <span>{u.name}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                              : u.role === 'p2tl'
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                              : u.role === 'supervisor'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                              : u.role === 'analyst'
                              ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40'
                              : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {u.email} • {u.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Email Input */}
            <div className="pt-2">
              <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Atau Masuk dengan Email Lain:
              </label>
              <input
                type="email"
                placeholder="email.petugas@pln.co.id"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                }`}
              />
            </div>

            {/* Login Action Button */}
            <button
              onClick={() => handleLoginSubmit()}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </button>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {regError && (
              <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${
                isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* Foto Profil Pegawai */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5">
              <div className="relative group shrink-0">
                {regAvatarUrl ? (
                  <img
                    src={regAvatarUrl}
                    alt="Preview Avatar"
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-cyan-500 shadow-md"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-lg">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer shadow-md transition">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelected}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1 text-left">
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Foto Profil Petugas (Bisa Diganti)
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pilih foto profil (.jpg/.png) untuk dipasang di Header akun.
                </div>
                {regAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setRegAvatarUrl('')}
                    className="text-[10px] text-rose-400 hover:underline mt-0.5"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nama Lengkap Petugas *
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Raden Bagus, S.T."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email PLN / Resmi *
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@pln.co.id"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Peran / Role (RBAC) *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600 focus:bg-white'
                  }`}
                >
                  <option value="analyst">Analis AMR (Upload, Analisa, Fasor, Ekspor)</option>
                  <option value="p2tl">Petugas P2TL (Investigasi Wiring Terbalik, BA)</option>
                  <option value="supervisor">Supervisor (Notifikasi Alert, Audit Penuh)</option>
                  <option value="admin">Administrator (Hak Penuh + Manajemen User)</option>
                  <option value="viewer">Viewer (Hanya Melihat Data)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Unit Organisasi / ULP Terdaftar *
                <span className="text-[10px] text-cyan-400 font-normal ml-1">
                  (User hanya akan menganalisa/melihat data sesuai unit ini)
                </span>
              </label>
              <div className="relative">
                <Building className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <select
                  required
                  value={regUnit}
                  onChange={(e) => setRegUnit(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600 focus:bg-white'
                  }`}
                >
                  {PLN_AVAILABLE_UNITS.map((unitName) => (
                    <option key={unitName} value={unitName}>
                      {unitName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Kata Sandi *
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ulangi Kata Sandi *
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type="password"
                    required
                    placeholder="Ulangi kata sandi"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Role Permissions preview */}
            <div className={`p-3 rounded-xl border text-[11px] ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                Hak Akses Peran ({regRole}):
              </span>{' '}
              {regRole === 'admin'
                ? 'Akses penuh termasuk manajemen user, pengunggahan data, analisis fasor, dan notifikasi email.'
                : regRole === 'p2tl'
                ? 'Fokus inspeksi wiring terbalik, cetak Berita Acara (BA), dan tindak lanjut lapangan.'
                : regRole === 'supervisor'
                ? 'Review diagnostik, konfirmasi denda kVARh, dan pengiriman alert email.'
                : regRole === 'viewer'
                ? 'Hanya membaca data dan diagram fasor tanpa hak mengubah atau mengunggah.'
                : 'Analisis menyeluruh, pengunggahan dataset Excel AMR, dan ekspor laporan audit.'}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan & Masuk Langsung</span>
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
