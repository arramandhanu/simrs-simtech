import { apiClient } from './apiClient';

export interface UserSettings {
    theme: 'light' | 'dark';
    language: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    sidebarCollapsed: boolean;
    compactMode: boolean;
}

export interface HospitalSettings {
    hospital_name: string;
    hospital_address: string;
    hospital_phone: string;
    hospital_email: string;
    hospital_logo: string;
    session_timeout_minutes: number;
    maintenance_mode: boolean;
    default_language: string;
    date_format: string;
    time_format: string;
}

export interface SmtpConfig {
    smtp_enabled: boolean;
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_pass: string;
    smtp_from: string;
    smtp_secure: boolean;
}

export interface NotificationChannels {
    notif_email_enabled: boolean;
    notif_whatsapp_enabled: boolean;
    notif_telegram_enabled: boolean;
    notif_whatsapp_provider: string;        // e.g. 'fonnte' | 'wablas' | 'custom'
    notif_whatsapp_api_url: string;
    notif_whatsapp_token: string;
    notif_whatsapp_from: string;
    notif_telegram_bot_token: string;
    notif_telegram_chat_id: string;
}

export interface Profile {
    id: number;
    name: string;
    email: string;
    role: string;
    position: string;
    isSSO: boolean;
    status: string;
    createdAt: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const settingsService = {
    // User settings
    getUserSettings: async (): Promise<ApiResponse<UserSettings>> => {
        const response = await apiClient.get<ApiResponse<UserSettings>>('/settings/user');
        return response.data;
    },
    updateUserSettings: async (settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> => {
        const response = await apiClient.put<ApiResponse<UserSettings>>('/settings/user', settings);
        return response.data;
    },

    // Profile
    getProfile: async (): Promise<ApiResponse<Profile>> => {
        const response = await apiClient.get<ApiResponse<Profile>>('/settings/profile');
        return response.data;
    },
    updateProfile: async (data: { name?: string; position?: string }): Promise<ApiResponse<Profile>> => {
        const response = await apiClient.put<ApiResponse<Profile>>('/settings/profile', data);
        return response.data;
    },

    // Hospital settings (admin only)
    getHospitalSettings: async (): Promise<ApiResponse<HospitalSettings>> => {
        const response = await apiClient.get<ApiResponse<HospitalSettings>>('/settings/hospital');
        return response.data;
    },
    updateHospitalSettings: async (settings: Partial<HospitalSettings>): Promise<ApiResponse<HospitalSettings>> => {
        const response = await apiClient.put<ApiResponse<HospitalSettings>>('/settings/hospital', settings);
        return response.data;
    },

    // SMTP config (admin only)
    getSmtpConfig: async (): Promise<ApiResponse<SmtpConfig>> => {
        const response = await apiClient.get<ApiResponse<SmtpConfig>>('/settings/smtp');
        return response.data;
    },
    updateSmtpConfig: async (config: Partial<SmtpConfig>): Promise<ApiResponse<{ message: string }>> => {
        const response = await apiClient.put<ApiResponse<{ message: string }>>('/settings/smtp', config);
        return response.data;
    },
    testSmtpConfig: async (config: Partial<SmtpConfig>): Promise<ApiResponse<{ message: string }>> => {
        const response = await apiClient.post<ApiResponse<{ message: string }>>('/settings/smtp/test', config);
        return response.data;
    },

    // Notification channels (admin only)
    getNotificationChannels: async (): Promise<ApiResponse<NotificationChannels>> => {
        const response = await apiClient.get<ApiResponse<NotificationChannels>>('/settings/notification-channels');
        return response.data;
    },
    updateNotificationChannels: async (config: Partial<NotificationChannels>): Promise<ApiResponse<{ message: string }>> => {
        const response = await apiClient.put<ApiResponse<{ message: string }>>('/settings/notification-channels', config);
        return response.data;
    },
};

