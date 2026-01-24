import { useState, useEffect } from 'react';
import { Settings, User, Bell, Palette, Building2, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../components/auth/RoleGuard';
import { settingsService, type UserSettings, type Profile, type HospitalSettings } from '../services/settingsService';

type TabType = 'profile' | 'appearance' | 'notifications' | 'hospital';

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
        ...(isAdmin ? [{ id: 'hospital' as const, label: 'Hospital', icon: Building2 }] : [])
    ];

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
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon size={18} />
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
            </div>
        </div>
    );
};

export default SettingsPage;
