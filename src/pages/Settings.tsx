import { useState, useEffect } from 'react';
import { Settings, User, Bell, Palette, Building2, Moon, Sun, Save, Loader2, Plus, Trash2, ListOrdered, Volume2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../components/auth/RoleGuard';
import { settingsService, type UserSettings, type Profile, type HospitalSettings } from '../services/settingsService';
import { departmentService } from '../services/departmentService';
import { counterService } from '../services/counterService';
import { ttsService } from '../services/ttsService';
import type { Department, Counter, VoiceTemplate, ClinicSchedule } from '../types/queue';

type TabType = 'profile' | 'appearance' | 'notifications' | 'hospital' | 'departments' | 'counters' | 'voice' | 'schedule';

export const SettingsPage = () => {
    const { user } = useAuth();
    const { isAdmin } = useRole();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile state
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileForm, setProfileForm] = useState({ name: '', position: '' });

    // User settings state
    const [userSettings, setUserSettings] = useState<UserSettings>({
        theme: 'light',
        language: 'id',
        notificationsEnabled: true,
        emailNotifications: true,
        sidebarCollapsed: false,
        compactMode: false
    });

    // Hospital settings state
    const [hospitalSettings, setHospitalSettings] = useState<Partial<HospitalSettings>>({});

    // Queue config state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [voiceTemplates, setVoiceTemplates] = useState<VoiceTemplate[]>([]);
    const [schedules, setSchedules] = useState<ClinicSchedule[]>([]);
    const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
    const [counterForm, setCounterForm] = useState({ department_id: 0, name: '', code: '' });
    const [templateForm, setTemplateForm] = useState({ language: 'id', template_text: '', description: '', is_default: false });
    const [scheduleForm, setScheduleForm] = useState({ department_id: 0, day_of_week: 0, open_time: '', close_time: '' });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profile and user settings
            const [profileRes, settingsRes] = await Promise.all([
                settingsService.getProfile(),
                settingsService.getUserSettings()
            ]);

            if (profileRes.success) {
                setProfile(profileRes.data);
                setProfileForm({ name: profileRes.data.name || '', position: profileRes.data.position || '' });
            }

            if (settingsRes.success) {
                setUserSettings(settingsRes.data);
                // Apply theme immediately
                document.documentElement.classList.toggle('dark', settingsRes.data.theme === 'dark');
            }

            // Fetch hospital settings if admin
            if (isAdmin) {
                try {
                    const hospitalRes = await settingsService.getHospitalSettings();
                    if (hospitalRes.success) {
                        setHospitalSettings(hospitalRes.data);
                    }
                } catch {
                    // Ignore - user might not have permission
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // Save profile
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateProfile(profileForm);
            if (res.success) {
                setProfile(res.data);
                showMessage('success', 'Profile updated successfully');
            }
        } catch {
            showMessage('error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Save user settings
    const handleSaveUserSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...userSettings, ...newSettings };
        setUserSettings(updated);

        // Apply theme immediately
        if (newSettings.theme) {
            document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
            localStorage.setItem('simrs_theme', newSettings.theme);
        }

        try {
            await settingsService.updateUserSettings(updated);
            showMessage('success', 'Settings saved');
        } catch {
            showMessage('error', 'Failed to save settings');
        }
    };

    // Save hospital settings
    const handleSaveHospitalSettings = async () => {
        setSaving(true);
        try {
            const res = await settingsService.updateHospitalSettings(hospitalSettings);
            if (res.success) {
                setHospitalSettings(res.data);
                showMessage('success', 'Hospital settings updated');
            }
        } catch {
            showMessage('error', 'Failed to update hospital settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        ...(isAdmin ? [
            { id: 'hospital' as const, label: 'Hospital', icon: Building2 },
            { id: 'departments' as const, label: 'Departemen', icon: Building2 },
            { id: 'counters' as const, label: 'Loket', icon: ListOrdered },
            { id: 'voice' as const, label: 'Suara & TTS', icon: Volume2 },
            { id: 'schedule' as const, label: 'Jadwal Klinik', icon: Clock },
        ] : [])
    ];

    // Fetch queue config data when switching to queue tabs
    useEffect(() => {
        if (['departments', 'counters', 'voice', 'schedule'].includes(activeTab) && isAdmin) {
            fetchQueueConfig();
        }
    }, [activeTab, isAdmin]);

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
        } catch (error) {
            console.error('Error fetching queue config:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-blue-600" />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage your account and preferences</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6 -mx-6 px-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-4 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap text-sm ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Profile Information</h2>

                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                                {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800">{profile?.email}</p>
                                <p className="text-sm text-slate-500">
                                    {profile?.isSSO ? '🔗 Connected via Google SSO' : '🔑 Local account'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 mt-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    value={profileForm.position}
                                    onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                                    placeholder="e.g., Senior Doctor, Nurse Manager"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    value={profile?.role || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Role can only be changed by an administrator</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Profile
                        </button>
                    </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Appearance</h2>

                        <div className="space-y-4">
                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {userSettings.theme === 'dark' ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                                    <div>
                                        <p className="font-medium text-slate-700">Theme</p>
                                        <p className="text-sm text-slate-500">Choose light or dark mode</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSaveUserSettings({ theme: userSettings.theme === 'light' ? 'dark' : 'light' })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userSettings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${userSettings.theme === 'dark' ? 'translate-x-7' : ''
                                        }`} />
                                </button>
                            </div>

                            {/* Compact Mode */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-700">Compact Mode</p>
                                    <p className="text-sm text-slate-500">Reduce padding and spacing</p>
                                </div>
                                <button
                                    onClick={() => handleSaveUserSettings({ compactMode: !userSettings.compactMode })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userSettings.compactMode ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${userSettings.compactMode ? 'translate-x-7' : ''
                                        }`} />
                                </button>
                            </div>

                            {/* Sidebar Collapsed */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-700">Collapsed Sidebar</p>
                                    <p className="text-sm text-slate-500">Start with sidebar minimized</p>
                                </div>
                                <button
                                    onClick={() => handleSaveUserSettings({ sidebarCollapsed: !userSettings.sidebarCollapsed })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userSettings.sidebarCollapsed ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${userSettings.sidebarCollapsed ? 'translate-x-7' : ''
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Notification Preferences</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-700">Push Notifications</p>
                                    <p className="text-sm text-slate-500">Receive in-app notifications</p>
                                </div>
                                <button
                                    onClick={() => handleSaveUserSettings({ notificationsEnabled: !userSettings.notificationsEnabled })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userSettings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${userSettings.notificationsEnabled ? 'translate-x-7' : ''
                                        }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-700">Email Notifications</p>
                                    <p className="text-sm text-slate-500">Receive email alerts for important updates</p>
                                </div>
                                <button
                                    onClick={() => handleSaveUserSettings({ emailNotifications: !userSettings.emailNotifications })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userSettings.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${userSettings.emailNotifications ? 'translate-x-7' : ''
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hospital Tab (Admin Only) */}
                {activeTab === 'hospital' && isAdmin && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Hospital Settings</h2>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
                                <input
                                    type="text"
                                    value={hospitalSettings.hospital_name || ''}
                                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospital_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    value={hospitalSettings.hospital_address || ''}
                                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospital_address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={hospitalSettings.hospital_phone || ''}
                                        onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospital_phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={hospitalSettings.hospital_email || ''}
                                        onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospital_email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Session Timeout (minutes)</label>
                                <input
                                    type="number"
                                    value={hospitalSettings.session_timeout_minutes || 60}
                                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, session_timeout_minutes: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveHospitalSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Hospital Settings
                        </button>
                    </div>
                )}

                {/* Departments Tab (Admin) */}
                {activeTab === 'departments' && isAdmin && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Manajemen Departemen</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!deptForm.name || !deptForm.code) return;
                            const res = await departmentService.create(deptForm);
                            if (res.success) { setDeptForm({ name: '', code: '', description: '' }); fetchQueueConfig(); showMessage('success', 'Departemen ditambahkan'); }
                            else showMessage('error', 'Gagal menambahkan departemen');
                        }} className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                                <input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Poli Umum" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kode</label>
                                <input type="text" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="A" maxLength={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah</button>
                        </form>

                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium">{dept.name}</span>
                                        <span className="ml-2 text-xs text-slate-500">({dept.code})</span>
                                        {!dept.is_active && <span className="ml-2 text-xs text-red-500">Nonaktif</span>}
                                    </div>
                                    <button onClick={async () => { await departmentService.remove(dept.id); fetchQueueConfig(); }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {departments.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada departemen</p>}
                        </div>
                    </div>
                )}

                {/* Counters Tab (Admin) */}
                {activeTab === 'counters' && isAdmin && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Manajemen Loket</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!counterForm.department_id || !counterForm.name || !counterForm.code) return;
                            const res = await counterService.create(counterForm);
                            if (res.success) { setCounterForm({ department_id: 0, name: '', code: '' }); fetchQueueConfig(); showMessage('success', 'Loket ditambahkan'); }
                            else showMessage('error', 'Gagal menambahkan loket');
                        }} className="flex gap-3 items-end flex-wrap">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Departemen</label>
                                <select value={counterForm.department_id} onChange={(e) => setCounterForm({ ...counterForm, department_id: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value={0} disabled>Pilih</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Loket</label>
                                <input type="text" value={counterForm.name} onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })} placeholder="Loket 1" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kode</label>
                                <input type="text" value={counterForm.code} onChange={(e) => setCounterForm({ ...counterForm, code: e.target.value })} placeholder="L1" maxLength={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah</button>
                        </form>

                        <div className="space-y-2">
                            {counters.map((counter) => (
                                <div key={counter.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium">{counter.name}</span>
                                        <span className="ml-2 text-xs text-slate-500">{counter.department_name} ({counter.code})</span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${counter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{counter.status}</span>
                                    </div>
                                    <button onClick={async () => { await counterService.remove(counter.id); fetchQueueConfig(); }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {counters.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada loket. Tambahkan departemen terlebih dahulu.</p>}
                        </div>
                    </div>
                )}

                {/* Voice & TTS Tab (Admin) */}
                {activeTab === 'voice' && isAdmin && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Suara & TTS</h2>
                        <p className="text-sm text-slate-500">Kelola template suara panggilan antrian. Gunakan placeholder: {'{{queue_number}}'}, {'{{counter_name}}'}, {'{{department_name}}'}, {'{{patient_name}}'}.</p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!templateForm.template_text) return;
                            const res = await ttsService.createTemplate(templateForm);
                            if (res.success) { setTemplateForm({ language: 'id', template_text: '', description: '', is_default: false }); fetchQueueConfig(); showMessage('success', 'Template ditambahkan'); }
                            else showMessage('error', 'Gagal menambahkan template');
                        }} className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-24">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa</label>
                                    <select value={templateForm.language} onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option value="id">ID</option>
                                        <option value="en">EN</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Template Teks</label>
                                    <input type="text" value={templateForm.template_text} onChange={(e) => setTemplateForm({ ...templateForm, template_text: e.target.value })} placeholder="Nomor antrian {{queue_number}}, silakan menuju {{counter_name}}." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                                    <input type="text" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Template panggilan standar" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer py-2">
                                    <input type="checkbox" checked={templateForm.is_default} onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })} className="text-blue-600" />
                                    <span className="text-sm">Default</span>
                                </label>
                                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Tambah</button>
                            </div>
                        </form>

                        <div className="space-y-2">
                            {voiceTemplates.map((tmpl) => (
                                <div key={tmpl.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{tmpl.language.toUpperCase()}</span>
                                            {tmpl.is_default && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Default</span>}
                                        </div>
                                        <p className="font-mono text-sm mt-1">{tmpl.template_text}</p>
                                        {tmpl.description && <p className="text-xs text-slate-500">{tmpl.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => {
                                            const utterance = new SpeechSynthesisUtterance(tmpl.template_text.replace(/\{\{.*?\}\}/g, 'contoh'));
                                            utterance.lang = tmpl.language === 'id' ? 'id-ID' : 'en-US';
                                            speechSynthesis.speak(utterance);
                                        }} className="text-blue-500 hover:text-blue-700 p-1" title="Test suara"><Volume2 size={16} /></button>
                                        <button onClick={async () => { await ttsService.deleteTemplate(tmpl.id); fetchQueueConfig(); }} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {voiceTemplates.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada template suara</p>}
                        </div>
                    </div>
                )}

                {/* Schedule Tab (Admin) */}
                {activeTab === 'schedule' && isAdmin && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800">Jadwal Klinik</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!scheduleForm.department_id) return;
                            const res = await ttsService.upsertSchedule(scheduleForm);
                            if (res.success) { fetchQueueConfig(); showMessage('success', 'Jadwal disimpan'); }
                            else showMessage('error', 'Gagal menyimpan jadwal');
                        }} className="flex gap-3 items-end flex-wrap">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Departemen</label>
                                <select value={scheduleForm.department_id} onChange={(e) => setScheduleForm({ ...scheduleForm, department_id: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                    <option value={0} disabled>Pilih</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="w-36">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                                <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                    {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Buka</label>
                                <input type="time" value={scheduleForm.open_time} onChange={(e) => setScheduleForm({ ...scheduleForm, open_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tutup</label>
                                <input type="time" value={scheduleForm.close_time} onChange={(e) => setScheduleForm({ ...scheduleForm, close_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save size={16} /> Simpan</button>
                        </form>

                        <div className="space-y-2">
                            {schedules.map((sched) => (
                                <div key={sched.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium">{sched.department_name}</span>
                                        <span className="ml-2 text-sm text-slate-500">
                                            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][sched.day_of_week]}
                                        </span>
                                        <span className="ml-2 text-sm">
                                            {sched.open_time || '-'} - {sched.close_time || '-'}
                                        </span>
                                        {!sched.is_active && <span className="ml-2 text-xs text-red-500">Nonaktif</span>}
                                    </div>
                                </div>
                            ))}
                            {schedules.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada jadwal</p>}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default SettingsPage;
