import { apiClient } from './apiClient';
import type {
    VoiceTemplate,
    VoiceTemplateFormData,
    ClinicSchedule,
    ClinicScheduleFormData,
} from '../types/queue';

/**
 * TTS Service
 * API calls for voice templates, text generation, and clinic schedules.
 */
export const ttsService = {
    // ---------- Voice Templates ----------

    async getTemplates() {
        return await apiClient.get<VoiceTemplate[]>('/tts/templates');
    },

    async createTemplate(data: VoiceTemplateFormData) {
        return await apiClient.post<VoiceTemplate>('/tts/templates', data);
    },

    async updateTemplate(id: number, data: Partial<VoiceTemplateFormData>) {
        return await apiClient.put<VoiceTemplate>(`/tts/templates/${id}`, data);
    },

    async deleteTemplate(id: number) {
        return await apiClient.delete(`/tts/templates/${id}`);
    },

    /** Generate the TTS text for a queue call */
    async generateCallText(queueItemId: number, language?: string) {
        return await apiClient.post<{ text: string; language: string; queue_number: string; counter_name: string }>(
            '/tts/generate',
            { queue_item_id: queueItemId, language }
        );
    },

    // ---------- Clinic Schedules ----------

    async getSchedules(departmentId?: number) {
        const endpoint = departmentId
            ? `/tts/schedules?department_id=${departmentId}`
            : '/tts/schedules';
        return await apiClient.get<ClinicSchedule[]>(endpoint);
    },

    async upsertSchedule(data: ClinicScheduleFormData) {
        return await apiClient.post<ClinicSchedule>('/tts/schedules', data);
    },
};
