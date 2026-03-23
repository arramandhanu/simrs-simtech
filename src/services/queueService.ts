import { apiClient } from './apiClient';
import type {
    QueueItem,
    QueueRegisterData,
    QueueStats,
    DisplayBoardData,
} from '../types/queue';

/**
 * Queue Service
 * API calls for queue management operations.
 */
export const queueService = {
    /** Get active queue items. Optional filters: department_id, status */
    async getActiveQueue(departmentId?: number, status?: string) {
        let endpoint = '/queue';
        const params = new URLSearchParams();
        if (departmentId) params.append('department_id', String(departmentId));
        if (status) params.append('status', status);
        const query = params.toString();
        if (query) endpoint += `?${query}`;

        return await apiClient.get<QueueItem[]>(endpoint);
    },

    /** Register a new patient to the queue */
    async registerPatient(data: QueueRegisterData) {
        return await apiClient.post<QueueItem>('/queue/register', data);
    },

    /** Call next patient for a counter */
    async callNext(counterId: number) {
        return await apiClient.post<QueueItem>('/queue/call-next', { counter_id: counterId });
    },

    /** Recall a patient */
    async recallPatient(id: number) {
        return await apiClient.post<QueueItem>(`/queue/${id}/recall`, {});
    },

    /** Skip a patient */
    async skipPatient(id: number) {
        return await apiClient.post<QueueItem>(`/queue/${id}/skip`, {});
    },

    /** Mark patient as serving */
    async servePatient(id: number) {
        return await apiClient.post<QueueItem>(`/queue/${id}/serve`, {});
    },

    /** Mark patient as completed */
    async completePatient(id: number) {
        return await apiClient.post<QueueItem>(`/queue/${id}/complete`, {});
    },

    /** Transfer patient to a different counter */
    async transferQueue(id: number, counterId: number) {
        return await apiClient.post<QueueItem>(`/queue/${id}/transfer`, { counter_id: counterId });
    },

    /** Get today's queue statistics */
    async getStats(departmentId?: number) {
        let endpoint = '/queue/stats';
        if (departmentId) endpoint += `?department_id=${departmentId}`;
        return await apiClient.get<QueueStats>(endpoint);
    },

    /** Get display board data (now serving, next up, waiting count) */
    async getDisplayBoard(departmentId?: number) {
        let endpoint = '/queue/display';
        if (departmentId) endpoint += `?department_id=${departmentId}`;
        return await apiClient.get<DisplayBoardData>(endpoint);
    },
};
