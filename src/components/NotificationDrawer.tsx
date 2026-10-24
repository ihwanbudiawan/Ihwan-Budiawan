import React, { useState } from 'react';
import { AppNotification, UserProfile, AMRRecord } from '../types/amr';
import {
  X,
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Info,
  Trash2,
  Mail,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  playAlertChime,
  generatePLNEmailBody,
  recordEmailDispatch,
  getDispatchedEmails
} from '../utils/notificationService';
import { useTheme } from '../context/ThemeContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onSelectIdpel?: (idpel: string) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  currentUser: UserProfile | null;
  criticalRecords: AMRRecord[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onSelectIdpel,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  currentUser,
  criticalRecords,
  soundEnabled,
  onToggleSound,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'alerts' | 'email'>('alerts');
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [previewEmail, setPreviewEmail] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'unread'>('all');

  const criticalNotifCount = notifications.filter(n => n.type === 'error' || n.severity === 'critical').length;
  const warningNotifCount = notifications.filter(n => n.type === 'warning' || n.severity === 'warning').length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterSeverity === 'critical') return n.type === 'error' || n.severity === 'critical';
    if (filterSeverity === 'warning') return n.type === 'warning' || n.severity === 'warning';
    if (filterSeverity === 'unread') return !n.read;
    return true;
  });

  if (!isOpen) return null;

  const handleSendEmailAlert = () => {
    if (!currentUser) return;
    const targetEmail = currentUser.email || 'ihwan.budiawan@gmail.com';
    const emailData = generatePLNEmailBody(currentUser, criticalRecords);

    // Record email in storage
    recordEmailDispatch({
      id: `email-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      recipientEmail: targetEmail,
      recipientName: currentUser.name,
      subject: emailData.subject,
      bodyPreview: emailData.textBody.substring(0, 160) + '...',
      status: 'sent',
      customerCount: criticalRecords.length,
      highestSeverity: 'critical',
    });

    playAlertChime('critical');
    setEmailStatus(`Email notifikasi resmi berhasil dikirim ke ${targetEmail}!`);
    setTimeout(() => setEmailStatus(''), 5000);
  };

  const dispatchedEmails = getDispatchedEmails();

  return (
    <div className={`fixed inset-0 z-50 flex justify-end backdrop-blur-xs animate-in fade-in duration-150 ${
      isDark ? 'bg-slate-950/70' : 'bg-slate-900/40'
    }`}>
      <div className={`w-full max-w-lg h-full p-5 shadow-2xl flex flex-col border-l ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Pusat Notifikasi & Alarm Real-Time
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {notifications.length}
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Peringatan anomali fasa, wiring terbalik, dan dispatch email
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border text-xs transition ${
                soundEnabled
                  ? isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Suara alarm aktif' : 'Suara alarm dibisukan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: In-App Alerts vs Email Notification */}
        <div className={`flex p-1 rounded-xl border text-xs my-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Peringatan Real-Time ({notifications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Kirim Notifikasi Email</span>
          </button>
        </div>

        {/* Status banner if email sent */}
        {emailStatus && (
          <div className={`p-3 mb-3 border rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}>
            <CheckCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>{emailStatus}</span>
          </div>
        )}

        {/* Filter Badges in Notification Center */}
        {activeTab === 'alerts' && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterSeverity === 'all'
                    ? isDark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
                    : isDark ? 'bg-slate-950 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                  filterSeverity === 'critical'
                    ? isDark ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isDark ? 'bg-slate-950 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <ShieldAlert className={`w-3 h-3 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                Kritis ({criticalNotifCount})
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                  filterSeverity === 'warning'
                    ? isDark ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isDark ? 'bg-slate-950 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <AlertTriangle className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                Peringatan ({warningNotifCount})
              </button>
              <button
                onClick={() => setFilterSeverity('unread')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterSeverity === 'unread'
                    ? isDark ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    : isDark ? 'bg-slate-950 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onMarkAllAsRead}
                  className={`text-[11px] font-medium transition ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                  title="Tandai semua notifikasi sudah dibaca"
                >
                  Tandai Semua Dibaca
                </button>
                <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
                <button
                  onClick={onClearAll}
                  className={`text-[11px] flex items-center gap-1 font-medium transition ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'}`}
                  title="Bersihkan semua riwayat notifikasi"
                >
                  <Trash2 className="w-3 h-3" /> Bersihkan
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: IN-APP ALERTS */}
        {activeTab === 'alerts' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredNotifications.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-48 text-center ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <CheckCircle className={`w-10 h-10 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className="text-xs font-semibold">Tidak ada peringatan untuk filter ini.</p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sistem bekerja normal dan tidak mendeteksi anomali baru.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const isError = n.type === 'error' || n.severity === 'critical';
                  const isWarn = n.type === 'warning' || n.severity === 'warning';
                  const isSuccess = n.type === 'success';

                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border text-xs transition relative group ${
                        !n.read ? (isDark ? 'ring-1 ring-cyan-500/40' : 'ring-1 ring-cyan-500/50 shadow-sm') : 'opacity-85'
                      } ${
                        isError
                          ? isDark ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/50' : 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/70'
                          : isWarn
                          ? isDark ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/40' : 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/70'
                          : isSuccess
                          ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40' : 'bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100/70'
                          : isDark ? 'bg-slate-950/80 border-slate-800 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isError ? (
                            <ShieldAlert className={`w-5 h-5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                          ) : isWarn ? (
                            <AlertTriangle className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          ) : isSuccess ? (
                            <CheckCircle className={`w-5 h-5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          ) : (
                            <Info className={`w-5 h-5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          {/* Title & Timestamp */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${
                                  isError
                                    ? isDark ? 'text-rose-300' : 'text-rose-800'
                                    : isWarn
                                    ? isDark ? 'text-amber-300' : 'text-amber-800'
                                    : isSuccess
                                    ? isDark ? 'text-emerald-300' : 'text-emerald-800'
                                    : isDark ? 'text-slate-200' : 'text-slate-900'
                                }`}>
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`} title="Belum dibaca" />
                                )}
                              </div>
                              {n.customerName && (
                                <div className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  Pelanggan: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{n.customerName}</strong>
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {n.timestamp}
                            </span>
                          </div>

                          {/* Message Body */}
                          <p className={`leading-relaxed text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {n.message}
                          </p>

                          {/* Technical Error Details Grid */}
                          {(n.affectedPhase || n.value || n.category) && (
                            <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl border text-[10px] font-mono ${
                              isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/80 border-slate-200'
                            }`}>
                              {n.affectedPhase && (
                                <div>
                                  <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fasa Terdampak: </span>
                                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>Fasa {n.affectedPhase}</strong>
                                </div>
                              )}
                              {n.value && (
                                <div>
                                  <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nilai Ukur: </span>
                                  <strong className={
                                    isError
                                      ? isDark ? 'text-rose-400' : 'text-rose-600'
                                      : isDark ? 'text-amber-400' : 'text-amber-600'
                                  }>
                                    {n.value}
                                  </strong>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Technical Recommendation */}
                          {n.recommendation && (
                            <div className={`p-2 rounded-xl border text-[10px] ${
                              isDark ? 'bg-slate-900/90 border-slate-800/80 text-slate-300' : 'bg-amber-50/80 border-amber-200 text-amber-950'
                            }`}>
                              <span className={`font-bold block font-sans ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                                Saran Tindak Lanjut Petugas:
                              </span>
                              <span className="mt-0.5 block">{n.recommendation}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            {n.relatedIdpel ? (
                              <button
                                onClick={() => {
                                  if (onSelectIdpel) {
                                    onSelectIdpel(n.relatedIdpel!);
                                    onClose();
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition border ${
                                  isDark
                                    ? 'bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border-cyan-500/40'
                                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                                }`}
                              >
                                <ExternalLink className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span>Buka Fasor IDPEL {n.relatedIdpel}</span>
                              </button>
                            ) : <span />}

                            <div className="flex items-center gap-2">
                              {!n.read && onMarkAsRead && (
                                <button
                                  onClick={() => onMarkAsRead(n.id)}
                                  className={`text-[10px] transition ${
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Tandai Dibaca
                                </button>
                              )}
                              {onDeleteNotification && (
                                <button
                                  onClick={() => onDeleteNotification(n.id)}
                                  className={`text-[10px] transition ${
                                    isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'
                                  }`}
                                  title="Hapus notifikasi"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL ALERT NOTIFICATION */}
        {activeTab === 'email' && (
          <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
            <div className={`border rounded-2xl p-4 space-y-3 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-2 font-bold text-xs ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Mail className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>Pengiriman Notifikasi Email ke Petugas</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Kirim ringkasan insiden anomali kritis (wiring terbalik, fasa hilang, cosphi rendah) langsung ke email pengguna yang sedang login.
              </p>

              {currentUser && (
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Penerima Email:</div>
                  <div className={`font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{currentUser.name}</span>
                    <span className={`font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{currentUser.email}</span>
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Peran: {currentUser.role.toUpperCase()} • Unit: {currentUser.unit}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSendEmailAlert}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Alert Email Sekarang</span>
                </button>
                <button
                  onClick={() => setPreviewEmail(!previewEmail)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {previewEmail ? 'Tutup Preview' : 'Preview Format'}
                </button>
              </div>
            </div>

            {/* Email Preview */}
            {previewEmail && currentUser && (
              <div className={`border rounded-2xl p-4 text-xs space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[10px] ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Format Pratinjau Email Resmi PLN:
                </div>
                <div className={`p-3 rounded-xl border font-mono text-[11px] whitespace-pre-wrap max-h-56 overflow-y-auto ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {generatePLNEmailBody(currentUser, criticalRecords).textBody}
                </div>
              </div>
            )}

            {/* Dispatched History */}
            <div className="space-y-2">
              <div className={`text-xs font-bold flex items-center justify-between ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span>Riwayat Email Terkirim</span>
                <span className="text-[10px] font-normal">{dispatchedEmails.length} Email</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dispatchedEmails.length === 0 ? (
                  <div className={`text-[11px] text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Belum ada riwayat email yang dikirim pada sesi ini.
                  </div>
                ) : (
                  dispatchedEmails.map((em) => (
                    <div
                      key={em.id}
                      className={`p-2.5 border rounded-xl text-[11px] space-y-1 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`flex items-center justify-between font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <span className="truncate max-w-[200px]">{em.subject}</span>
                        <span className={`font-mono text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{em.timestamp}</span>
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Terkirim ke: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900 font-semibold'}`}>{em.recipientEmail}</span> ({em.customerCount} Pelanggan)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
