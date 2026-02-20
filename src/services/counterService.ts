import { apiClient } from './apiClient';
import type { Counter, CounterFormData } from '../types/queue';

/**
 * Counter Service
 * API calls for counter (loket) management.
 */
export const counterService = {
    async getAll(departmentId?: number) {
        const endpoint = departmentId
            ? `/counters?department_id=${departmentId}`
            : '/counters';
        return await apiClient.get<Counter[]>(endpoint);
    },

    async getById(id: number) {
        return await apiClient.get<Counter>(`/counters/${id}`);
    },

    async create(data: CounterFormData) {
        return await apiClient.post<Counter>('/counters', data);
    },

    async update(id: number, data: Partial<CounterFormData & { status: string }>) {
        return await apiClient.put<Counter>(`/counters/${id}`, data);
    },

    async remove(id: number) {
        return await apiClient.delete(`/counters/${id}`);
    },

    /** Assign current user as operator of this counter */
    async assign(id: number) {
        return await apiClient.post<Counter>(`/counters/${id}/assign`, {});
    },

    /** Release operator from counter */
    async release(id: number) {
        return await apiClient.post<Counter>(`/counters/${id}/release`, {});
    },
};
