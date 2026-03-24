import { useState, useEffect, useRef } from 'react';
import {
    Settings, User, Bell, Palette, Building2, Moon, Sun, Save, Loader2,
    Plus, Trash2, ListOrdered, Volume2, Clock, Mail, MessageSquare,
    Send, ChevronRight, ChevronLeft, Wifi, WifiOff, TestTube2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../components/auth/RoleGuard';
import {
    settingsService, type UserSettings, type Profile,
    type HospitalSettings, type SmtpConfig, type NotificationChannels
} from '../services/settingsService';
import { departmentService } from '../services/departmentService';
import { counterService } from '../services/counterService';
import { ttsService } from '../services/ttsService';
import type { Department, Counter, VoiceTemplate, ClinicSchedule } from '../types/queue';
import { useAppearance } from '../context/AppearanceContext';

type TabType = 'profile' | 'appearance' | 'notifications' | 'smtp' | 'channels' | 'hospital' | 'departments' | 'counters' | 'voice' | 'schedule';

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition placeholder:text-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <p className="font-semibold text-sm text-slate-800">{title}</p>
            {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
        <div className="p-5 space-y-4">{children}</div>
    </div>
);

// ─── Setting Row (label + toggle) ─────────────────────────────────────────────
const SettingRow = ({ icon: Icon, title, desc, checked, onChange }: {
    icon?: React.ElementType; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            {Icon && <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon size={16} className="text-slate-500" /></div>}
            <div>
                <p className="text-sm font-medium text-slate-700">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
            </div>
        </div>
        <Toggle checked={checked} onChange={onChange} />
    </div>
);

// ─── Main Settings Page ───────────────────────────────────────────────────────
export const SettingsPage = () => {
    const { user } = useAuth();
    const { isAdmin } = useRole();
    const { isDark, setTheme, setCompact, setSidebarCollapsed } = useAppearance();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const tabBarRef = useRef<HTMLDivElement>(null);

    // Profile state
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileForm, setProfileForm] = useState({ name: '', position: '' });

    // User settings
    const [userSettings, setUserSettings] = useState<UserSettings>({
        theme: 'light', language: 'id', notificationsEnabled: true,
        emailNotifications: true, sidebarCollapsed: false, compactMode: false
    });

    // Hospital
    const [hospitalSettings, setHospitalSettings] = useState<Partial<HospitalSettings>>({});

    // SMTP
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
        smtp_enabled: false, smtp_host: '', smtp_port: '587',
        smtp_user: '', smtp_pass: '', smtp_from: '', smtp_secure: true
    });

    // Notification channels
    const [channels, setChannels] = useState<NotificationChannels>({
        notif_email_enabled: false, notif_whatsapp_enabled: false, notif_telegram_enabled: false,
        notif_whatsapp_provider: 'fonnte', notif_whatsapp_api_url: '', notif_whatsapp_token: '',
        notif_whatsapp_from: '', notif_telegram_bot_token: '', notif_telegram_chat_id: ''
    });

    // Queue config
    const [departments, setDepartments] = useState<Department[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [voiceTemplates, setVoiceTemplates] = useState<VoiceTemplate[]>([]);
    const [schedules, setSchedules] = useState<ClinicSchedule[]>([]);
    const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
    const [counterForm, setCounterForm] = useState({ department_id: 0, name: '', code: '' });
    const [templateForm, setTemplateForm] = useState({ language: 'id', template_text: '', description: '', is_default: false });
    const [scheduleForm, setScheduleForm] = useState({ department_id: 0, day_of_week: 0, open_time: '', close_time: '' });

    // ── Tabs definition ───────────────────────────────────────────────────────
    const userTabs = [
        { id: 'profile' as const,       label: 'Profile',         icon: User },
        { id: 'appearance' as const,    label: 'Tampilan',        icon: Palette },
        { id: 'notifications' as const, label: 'Notifikasi',      icon: Bell },
    ];
    const adminTabs = isAdmin ? [
        { id: 'smtp' as const,          label: 'Email / SMTP',    icon: Mail },
        { id: 'channels' as const,      label: 'Saluran Notif.',  icon: MessageSquare },
        { id: 'hospital' as const,      label: 'Rumah Sakit',     icon: Building2 },
        { id: 'departments' as const,   label: 'Departemen',      icon: Building2 },
        { id: 'counters' as const,      label: 'Loket',           icon: ListOrdered },
        { id: 'voice' as const,         label: 'Suara & TTS',     icon: Volume2 },
        { id: 'schedule' as const,      label: 'Jadwal Klinik',   icon: Clock },
    ] : [];

    useEffect(() => { fetchData(); }, []);

    // Re-fetch queue config whenever entering a queue-related tab
    useEffect(() => {
        if (['departments', 'counters', 'voice', 'schedule'].includes(activeTab) && isAdmin) {
            fetchQueueConfig();
        }
        if (['smtp'].includes(activeTab) && isAdmin) fetchSmtp();
        if (['channels'].includes(activeTab) && isAdmin) fetchChannels();
    }, [activeTab, isAdmin]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, settingsRes] = await Promise.all([
                settingsService.getProfile(),
                settingsService.getUserSettings(),
            ]);
            if (profileRes.success) {
                setProfile(profileRes.data);
                setProfileForm({ name: profileRes.data.name || '', position: profileRes.data.position || '' });
            }
            if (settingsRes.success) {
                setUserSettings(settingsRes.data);
                // Sync context with saved setting (instead of touching classList directly)
                setTheme(settingsRes.data.theme === 'dark');
            }
            if (isAdmin) {
                try {
                    const hospitalRes = await settingsService.getHospitalSettings();
                    if (hospitalRes.success) setHospitalSettings(hospitalRes.data);
                } catch { /* no admin access */ }
            }
        } catch { showMessage('error', 'Gagal memuat pengaturan'); }
        finally { setLoading(false); }
    };

    const fetchQueueConfig = async () => {
        try {
            const [deptRes, counterRes, templateRes, scheduleRes] = await Promise.all([
                departmentService.getAll(),
                counterService.getAll(),
                ttsService.getTemplates(),
                ttsService.getSchedules(),
            ]);
            if (deptRes.success) setDepartments(deptRes.data);
            if (counterRes.success) setCounters(counterRes.data);
            if (templateRes.success) setVoiceTemplates(templateRes.data);
            if (scheduleRes.success) setSchedules(scheduleRes.data);
        } catch { /* silent */ }
    };

    const fetchSmtp = async () => {
        try {
            const res = await settingsService.getSmtpConfig();
            if (res.success) setSmtpConfig(res.data);
        } catch { /* silent */ }
    };

    const fetchChannels = async () => {
        try {
            const res = await settingsService.getNotificationChannels();
            if (res.success) setChannels(res.data);
        } catch { /* silent */ }
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateProfile(profileForm);
            if (res.success) { setProfile(res.data); showMessage('success', 'Profil diperbarui'); }
        } catch { showMessage('error', 'Gagal memperbarui profil'); }
        finally { setSaving(false); }
    };

    const handleSaveUserSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...userSettings, ...newSettings };
        setUserSettings(updated);
        if (newSettings.theme !== undefined) setTheme(newSettings.theme === 'dark');
        if (newSettings.compactMode !== undefined) setCompact(newSettings.compactMode);
        if (newSettings.sidebarCollapsed !== undefined) setSidebarCollapsed(newSettings.sidebarCollapsed);
        try { await settingsService.updateUserSettings(updated); showMessage('success', 'Pengaturan disimpan'); }
        catch { showMessage('error', 'Gagal menyimpan'); }
    };

    const handleSaveHospital = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateHospitalSettings(hospitalSettings);
            if (res.success) { setHospitalSettings(res.data); showMessage('success', 'Pengaturan RS disimpan'); }
        } catch { showMessage('error', 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleSaveSmtp = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateSmtpConfig(smtpConfig);
            if (res.success) showMessage('success', res.message || 'Konfigurasi SMTP disimpan');
            else showMessage('error', res.message || 'Gagal menyimpan');
        } catch { showMessage('error', 'Gagal menyimpan SMTP'); }
        finally { setSaving(false); }
    };

    const handleTestSmtp = async () => {
        setTesting(true);
        try {
            const res = await settingsService.testSmtpConfig(smtpConfig);
            if (res.success) showMessage('success', res.message || 'Test berhasil!');
            else showMessage('error', res.message || 'Test gagal');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            showMessage('error', e?.response?.data?.message || 'Koneksi SMTP gagal');
        } finally { setTesting(false); }
    };

    const handleSaveChannels = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateNotificationChannels(channels);
            if (res.success) showMessage('success', 'Saluran notifikasi disimpan');
            else showMessage('error', res.message || 'Gagal');
        } catch { showMessage('error', 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const scrollTabs = (dir: 'left' | 'right') => {
        if (tabBarRef.current) tabBarRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                    <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Settings</h1>
                    <p className="text-xs text-slate-400">Manage your account and preferences</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3.5 rounded-xl text-sm border ${message.type === 'success'
                    ? 'bg-green-50 border-green-100 text-green-700'
                    : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* ── Tab bar (scrollable with left/right arrows) ── */}
            <div className="mb-6">
                {/* User tabs row */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-2 w-fit">
                    {userTabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <t.icon size={13} />{t.label}
                        </button>
                    ))}
                </div>
                {/* Admin tabs row — scrollable */}
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => scrollTabs('left')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0">
                            <ChevronLeft size={16} />
                        </button>
                        <div ref={tabBarRef} className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-hidden scroll-smooth flex-1">
                            {adminTabs.map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <t.icon size={13} />{t.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => scrollTabs('right')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Tab content ── */}
            <div className="space-y-4">

                {/* Profile */}
                {activeTab === 'profile' && (
                    <>
                        <SectionCard title="Informasi Profil" desc="Nama dan jabatan ditampilkan di seluruh sistem">
                            <div className="flex items-center gap-4 pb-2">
                                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                                    {(profile?.name || user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{profile?.email}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{profile?.isSSO ? '🔗 Google SSO' : '🔑 Local account'}</p>
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">{profile?.role}</span>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <div><label className={labelCls}>Nama Lengkap</label>
                                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} placeholder="John Doe" /></div>
                                <div><label className={labelCls}>Jabatan</label>
                                    <input type="text" value={profileForm.position} onChange={e => setProfileForm({ ...profileForm, position: e.target.value })} className={inputCls} placeholder="Dokter Umum, Perawat, dsb." /></div>
                            </div>
                            <button onClick={handleSaveProfile} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Profil
                            </button>
                        </SectionCard>
                    </>
                )}

                {/* Appearance */}
                {activeTab === 'appearance' && (
                    <SectionCard title="Tampilan" desc="Sesuaikan tema dan layout aplikasi">
                        <SettingRow icon={isDark ? Moon : Sun}
                            title="Mode Gelap" desc="Aktifkan tampilan dark mode"
                            checked={isDark}
                            onChange={v => handleSaveUserSettings({ theme: v ? 'dark' : 'light' })} />
                        <SettingRow title="Compact Mode" desc="Kurangi padding dan jarak antar elemen"
                            checked={userSettings.compactMode}
                            onChange={v => handleSaveUserSettings({ compactMode: v })} />
                        <SettingRow title="Sidebar Tersimpan" desc="Mulai dengan sidebar yang diminimalkan"
                            checked={userSettings.sidebarCollapsed}
                            onChange={v => handleSaveUserSettings({ sidebarCollapsed: v })} />
                    </SectionCard>
                )}

                {/* Notifications (per-user) */}
                {activeTab === 'notifications' && (
                    <SectionCard title="Preferensi Notifikasi" desc="Pilih jenis notifikasi yang ingin Anda terima">
                        <SettingRow icon={Bell} title="Notifikasi In-App" desc="Terima notifikasi di dalam aplikasi"
                            checked={userSettings.notificationsEnabled}
                            onChange={v => handleSaveUserSettings({ notificationsEnabled: v })} />
                        <SettingRow icon={Mail} title="Email Notifikasi" desc="Terima pemberitahuan ke email Anda"
                            checked={userSettings.emailNotifications}
                            onChange={v => handleSaveUserSettings({ emailNotifications: v })} />
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Untuk mengaktifkan pengiriman email, admin perlu mengkonfigurasikan SMTP di tab <strong>Email / SMTP</strong>. Untuk WhatsApp/Telegram, konfigurasi di <strong>Saluran Notifikasi</strong>.</p>
                        </div>
                    </SectionCard>
                )}

                {/* SMTP Config (admin) */}
                {activeTab === 'smtp' && isAdmin && (
                    <SectionCard title="Konfigurasi Email / SMTP" desc="Pengaturan server email untuk notifikasi sistem">
                        <SettingRow icon={smtpConfig.smtp_enabled ? Wifi : WifiOff}
                            title="Aktifkan SMTP" desc="Kirim email notifikasi menggunakan SMTP"
                            checked={smtpConfig.smtp_enabled}
                            onChange={v => setSmtpConfig(p => ({ ...p, smtp_enabled: v }))} />

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                                <label className={labelCls}>SMTP Host</label>
                                <input type="text" value={smtpConfig.smtp_host} onChange={e => setSmtpConfig(p => ({ ...p, smtp_host: e.target.value }))}
                                    className={inputCls} placeholder="smtp.gmail.com" />
                            </div>
                            <div>
                                <label className={labelCls}>Port</label>
                                <input type="text" value={smtpConfig.smtp_port} onChange={e => setSmtpConfig(p => ({ ...p, smtp_port: e.target.value }))}
                                    className={inputCls} placeholder="587" />
                            </div>
                            <div>
                                <label className={labelCls}>Username / Email</label>
                                <input type="email" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig(p => ({ ...p, smtp_user: e.target.value }))}
                                    className={inputCls} placeholder="noreply@hospital.com" />
                            </div>
                            <div>
                                <label className={labelCls}>Password / App Key</label>
                                <input type="password" value={smtpConfig.smtp_pass} onChange={e => setSmtpConfig(p => ({ ...p, smtp_pass: e.target.value }))}
                                    className={inputCls} placeholder="••••••••" />
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>From Address (tampil pengirim)</label>
                                <input type="email" value={smtpConfig.smtp_from} onChange={e => setSmtpConfig(p => ({ ...p, smtp_from: e.target.value }))}
                                    className={inputCls} placeholder="SIMRS <noreply@hospital.com>" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="smtp_secure" checked={smtpConfig.smtp_secure}
                                onChange={e => setSmtpConfig(p => ({ ...p, smtp_secure: e.target.checked }))}
                                className="rounded border-slate-300 text-blue-600" />
                            <label htmlFor="smtp_secure" className="text-sm text-slate-600 cursor-pointer">Gunakan SSL/TLS (port 465)</label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleSaveSmtp} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                            </button>
                            <button onClick={handleTestSmtp} disabled={testing || !smtpConfig.smtp_host}
                                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-40 text-slate-600">
                                {testing ? <Loader2 size={15} className="animate-spin" /> : <TestTube2 size={15} />} Kirim Test Email
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                            <p className="font-semibold">Tips konfigurasi Gmail:</p>
                            <p>Host: <code>smtp.gmail.com</code> · Port: <code>587</code> (TLS) atau <code>465</code> (SSL)</p>
                            <p>Gunakan <strong>App Password</strong> jika akun Google mengaktifkan 2FA.</p>
                        </div>
                    </SectionCard>
                )}

                {/* Notification channels (admin) */}
                {activeTab === 'channels' && isAdmin && (
                    <>
                        {/* Email channel */}
                        <SectionCard title="Email" desc="Aktifkan notifikasi via Email (membutuhkan konfigurasi SMTP)">
                            <SettingRow icon={Mail} title="Email Notifikasi" desc="Kirim alert event penting ke email pengguna"
                                checked={channels.notif_email_enabled}
                                onChange={v => setChannels(p => ({ ...p, notif_email_enabled: v }))} />
                        </SectionCard>

                        {/* WhatsApp channel */}
                        <SectionCard title="WhatsApp" desc="Kirim notifikasi via WhatsApp API">
                            <SettingRow icon={MessageSquare} title="WhatsApp Aktif" desc="Aktifkan pengiriman pesan WhatsApp"
                                checked={channels.notif_whatsapp_enabled}
                                onChange={v => setChannels(p => ({ ...p, notif_whatsapp_enabled: v }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelCls}>Provider</label>
                                    <select value={channels.notif_whatsapp_provider} onChange={e => setChannels(p => ({ ...p, notif_whatsapp_provider: e.target.value }))} className={inputCls}>
                                        <option value="fonnte">Fonnte</option>
                                        <option value="wablas">Wablas</option>
                                        <option value="wanotif">WaNotif</option>
                                        <option value="custom">Custom / Manual</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>API URL</label>
                                    <input type="url" value={channels.notif_whatsapp_api_url} onChange={e => setChannels(p => ({ ...p, notif_whatsapp_api_url: e.target.value }))}
                                        className={inputCls} placeholder="https://api.fonnte.com/send" />
                                </div>
                                <div>
                                    <label className={labelCls}>Token API</label>
                                    <input type="password" value={channels.notif_whatsapp_token} onChange={e => setChannels(p => ({ ...p, notif_whatsapp_token: e.target.value }))}
                                        className={inputCls} placeholder="Bearer token..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Nomor Pengirim</label>
                                    <input type="text" value={channels.notif_whatsapp_from} onChange={e => setChannels(p => ({ ...p, notif_whatsapp_from: e.target.value }))}
                                        className={inputCls} placeholder="6281234567890" />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Telegram channel */}
                        <SectionCard title="Telegram Bot" desc="Kirim notifikasi via Telegram Bot">
                            <SettingRow icon={Send} title="Telegram Aktif" desc="Aktifkan pengiriman pesan Telegram"
                                checked={channels.notif_telegram_enabled}
                                onChange={v => setChannels(p => ({ ...p, notif_telegram_enabled: v }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Bot Token</label>
                                    <input type="password" value={channels.notif_telegram_bot_token} onChange={e => setChannels(p => ({ ...p, notif_telegram_bot_token: e.target.value }))}
                                        className={inputCls} placeholder="123456:ABCDEF..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Chat ID / Group ID</label>
                                    <input type="text" value={channels.notif_telegram_chat_id} onChange={e => setChannels(p => ({ ...p, notif_telegram_chat_id: e.target.value }))}
                                        className={inputCls} placeholder="-100123456789" />
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                                <p className="font-semibold">Cara mendapatkan Bot Token:</p>
                                <p>1. Chat <code>@BotFather</code> di Telegram → /newbot</p>
                                <p>2. Chat ID bisa didapatkan via <code>@userinfobot</code> atau URL <code>/getUpdates</code></p>
                            </div>
                        </SectionCard>

                        <button onClick={handleSaveChannels} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Semua Saluran
                        </button>
                    </>
                )}

                {/* Hospital */}
                {activeTab === 'hospital' && isAdmin && (
                    <SectionCard title="Informasi Rumah Sakit">
                        <div className="grid gap-3">
                            <div><label className={labelCls}>Nama RS</label>
                                <input type="text" value={hospitalSettings.hospital_name || ''} onChange={e => setHospitalSettings({ ...hospitalSettings, hospital_name: e.target.value })} className={inputCls} /></div>
                            <div><label className={labelCls}>Alamat</label>
                                <textarea value={hospitalSettings.hospital_address || ''} onChange={e => setHospitalSettings({ ...hospitalSettings, hospital_address: e.target.value })} rows={2} className={inputCls} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={labelCls}>Telepon</label>
                                    <input type="text" value={hospitalSettings.hospital_phone || ''} onChange={e => setHospitalSettings({ ...hospitalSettings, hospital_phone: e.target.value })} className={inputCls} /></div>
                                <div><label className={labelCls}>Email RS</label>
                                    <input type="email" value={hospitalSettings.hospital_email || ''} onChange={e => setHospitalSettings({ ...hospitalSettings, hospital_email: e.target.value })} className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Session Timeout (menit)</label>
                                <input type="number" value={hospitalSettings.session_timeout_minutes || 60} onChange={e => setHospitalSettings({ ...hospitalSettings, session_timeout_minutes: parseInt(e.target.value) })} className={inputCls} /></div>
                        </div>
                        <button onClick={handleSaveHospital} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                        </button>
                    </SectionCard>
                )}

                {/* Departments */}
                {activeTab === 'departments' && isAdmin && (
                    <SectionCard title="Manajemen Departemen" desc="Tambah atau hapus departemen poli">
                        <form onSubmit={async e => {
                            e.preventDefault();
                            if (!deptForm.name || !deptForm.code) return;
                            const res = await departmentService.create(deptForm);
                            if (res.success) { setDeptForm({ name: '', code: '', description: '' }); fetchQueueConfig(); showMessage('success', 'Departemen ditambahkan'); }
                            else showMessage('error', 'Gagal menambahkan departemen');
                        }} className="flex gap-2 items-end flex-wrap">
                            <div className="flex-1 min-w-32">
                                <label className={labelCls}>Nama Departemen</label>
                                <input type="text" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Poli Umum" className={inputCls} />
                            </div>
                            <div className="w-24">
                                <label className={labelCls}>Kode</label>
                                <input type="text" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="A" maxLength={5} className={inputCls} />
                            </div>
                            <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
                                <Plus size={15} /> Tambah
                            </button>
                        </form>
                        <div className="space-y-2 mt-2">
                            {departments.map(dept => (
                                <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div>
                                        <span className="text-sm font-medium text-slate-800">{dept.name}</span>
                                        <span className="ml-2 text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{dept.code}</span>
                                        {!dept.is_active && <span className="ml-2 text-xs text-red-500">Nonaktif</span>}
                                    </div>
                                    <button onClick={async () => { await departmentService.remove(dept.id); fetchQueueConfig(); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                            {departments.length === 0 && <p className="text-center text-slate-400 text-sm py-6">Belum ada departemen. Tambahkan di atas.</p>}
                        </div>
                    </SectionCard>
                )}

                {/* Counters */}
                {activeTab === 'counters' && isAdmin && (
                    <SectionCard title="Manajemen Loket" desc="Loket terhubung ke departemen yang sudah dikonfigurasi">
                        {departments.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-amber-600 font-medium">⚠️ Belum ada departemen</p>
                                <p className="text-xs text-slate-400 mt-1">Tambahkan departemen di tab <strong>Departemen</strong> terlebih dahulu</p>
                            </div>
                        ) : (
                            <form onSubmit={async e => {
                                e.preventDefault();
                                if (!counterForm.department_id || !counterForm.name || !counterForm.code) return;
                                const res = await counterService.create(counterForm);
                                if (res.success) { setCounterForm({ department_id: 0, name: '', code: '' }); fetchQueueConfig(); showMessage('success', 'Loket ditambahkan'); }
                                else showMessage('error', 'Gagal menambahkan loket');
                            }} className="flex gap-2 items-end flex-wrap">
                                <div className="w-44">
                                    <label className={labelCls}>Departemen</label>
                                    <select value={counterForm.department_id} onChange={e => setCounterForm({ ...counterForm, department_id: Number(e.target.value) })} className={inputCls}>
                                        <option value={0} disabled>Pilih departemen</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-32">
                                    <label className={labelCls}>Nama Loket</label>
                                    <input type="text" value={counterForm.name} onChange={e => setCounterForm({ ...counterForm, name: e.target.value })} placeholder="Loket 1" className={inputCls} />
                                </div>
                                <div className="w-24">
                                    <label className={labelCls}>Kode</label>
                                    <input type="text" value={counterForm.code} onChange={e => setCounterForm({ ...counterForm, code: e.target.value })} placeholder="L1" maxLength={5} className={inputCls} />
                                </div>
                                <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
                                    <Plus size={15} /> Tambah
                                </button>
                            </form>
                        )}
                        <div className="space-y-2 mt-2">
                            {counters.map(counter => (
                                <div key={counter.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div>
                                        <span className="text-sm font-medium text-slate-800">{counter.name}</span>
                                        <span className="ml-2 text-xs text-slate-400">{counter.department_name}</span>
                                        <span className="ml-2 text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{counter.code}</span>
                                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${counter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{counter.status}</span>
                                    </div>
                                    <button onClick={async () => { await counterService.remove(counter.id); fetchQueueConfig(); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                            {counters.length === 0 && departments.length > 0 && <p className="text-center text-slate-400 text-sm py-6">Belum ada loket. Tambahkan di atas.</p>}
                        </div>
                    </SectionCard>
                )}

                {/* Voice & TTS */}
                {activeTab === 'voice' && isAdmin && (
                    <SectionCard title="Suara & TTS" desc="Template teks untuk panggilan antrian. Gunakan: {{queue_number}}, {{counter_name}}, {{department_name}}, {{patient_name}}">
                        <form onSubmit={async e => {
                            e.preventDefault();
                            if (!templateForm.template_text) return;
                            const res = await ttsService.createTemplate(templateForm);
                            if (res.success) { setTemplateForm({ language: 'id', template_text: '', description: '', is_default: false }); fetchQueueConfig(); showMessage('success', 'Template ditambahkan'); }
                            else showMessage('error', 'Gagal menambahkan template');
                        }} className="space-y-3">
                            <div className="flex gap-2">
                                <div className="w-24">
                                    <label className={labelCls}>Bahasa</label>
                                    <select value={templateForm.language} onChange={e => setTemplateForm({ ...templateForm, language: e.target.value })} className={inputCls}>
                                        <option value="id">ID</option>
                                        <option value="en">EN</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className={labelCls}>Template Teks</label>
                                    <input type="text" value={templateForm.template_text} onChange={e => setTemplateForm({ ...templateForm, template_text: e.target.value })}
                                        placeholder="Nomor antrian {{queue_number}}, silakan menuju {{counter_name}}." className={inputCls} />
                                </div>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className={labelCls}>Deskripsi (opsional)</label>
                                    <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Template standar" className={inputCls} />
                                </div>
                                <label className="flex items-center gap-1.5 cursor-pointer py-2.5 text-sm text-slate-600 whitespace-nowrap">
                                    <input type="checkbox" checked={templateForm.is_default} onChange={e => setTemplateForm({ ...templateForm, is_default: e.target.checked })} className="rounded" /> Default
                                </label>
                                <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
                                    <Plus size={15} /> Tambah
                                </button>
                            </div>
                        </form>
                        <div className="space-y-2 mt-2">
                            {voiceTemplates.map(tmpl => (
                                <div key={tmpl.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{tmpl.language.toUpperCase()}</span>
                                            {tmpl.is_default && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Default</span>}
                                        </div>
                                        <p className="font-mono text-xs text-slate-700">{tmpl.template_text}</p>
                                        {tmpl.description && <p className="text-xs text-slate-400">{tmpl.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => {
                                            const u = new SpeechSynthesisUtterance(tmpl.template_text.replace(/\{\{.*?\}\}/g, 'contoh'));
                                            u.lang = tmpl.language === 'id' ? 'id-ID' : 'en-US';
                                            speechSynthesis.speak(u);
                                        }} className="p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition" title="Test suara">
                                            <Volume2 size={15} />
                                        </button>
                                        <button onClick={async () => { await ttsService.deleteTemplate(tmpl.id); fetchQueueConfig(); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {voiceTemplates.length === 0 && <p className="text-center text-slate-400 text-sm py-6">Belum ada template suara</p>}
                        </div>
                    </SectionCard>
                )}

                {/* Schedule */}
                {activeTab === 'schedule' && isAdmin && (
                    <SectionCard title="Jadwal Klinik" desc="Atur jam buka dan tutup setiap departemen per hari">
                        <form onSubmit={async e => {
                            e.preventDefault();
                            if (!scheduleForm.department_id) return;
                            const res = await ttsService.upsertSchedule(scheduleForm);
                            if (res.success) { fetchQueueConfig(); showMessage('success', 'Jadwal disimpan'); }
                            else showMessage('error', 'Gagal menyimpan jadwal');
                        }} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                            <div className="col-span-2 sm:col-span-1">
                                <label className={labelCls}>Departemen</label>
                                <select value={scheduleForm.department_id} onChange={e => setScheduleForm({ ...scheduleForm, department_id: Number(e.target.value) })} className={inputCls}>
                                    <option value={0} disabled>Pilih</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Hari</label>
                                <select value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })} className={inputCls}>
                                    {['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Jam Buka</label>
                                <input type="time" value={scheduleForm.open_time} onChange={e => setScheduleForm({ ...scheduleForm, open_time: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Jam Tutup</label>
                                <input type="time" value={scheduleForm.close_time} onChange={e => setScheduleForm({ ...scheduleForm, close_time: e.target.value })} className={inputCls} />
                            </div>
                            <button type="submit" className="col-span-2 sm:col-span-4 flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition w-fit">
                                <Save size={15} /> Simpan Jadwal
                            </button>
                        </form>
                        <div className="space-y-2 mt-2">
                            {schedules.map(sched => (
                                <div key={sched.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                            {['Min','Sen','Sel','Rab','Kam','Jum','Sab'][sched.day_of_week]}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800">{sched.department_name}</span>
                                        <span className="text-xs text-slate-400">{sched.open_time || '-'} – {sched.close_time || '-'}</span>
                                        {!sched.is_active && <span className="text-xs text-red-500">Nonaktif</span>}
                                    </div>
                                </div>
                            ))}
                            {schedules.length === 0 && <p className="text-center text-slate-400 text-sm py-6">Belum ada jadwal klinik</p>}
                        </div>
                    </SectionCard>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
