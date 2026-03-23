import { apiClient } from './apiClient';
import type { Department, DepartmentFormData } from '../types/queue';

/**
 * Department Service
 * API calls for department (clinic) management.
 */
export const departmentService = {
    async getAll(activeOnly?: boolean) {
        const endpoint = activeOnly ? '/departments?active=true' : '/departments';
        return await apiClient.get<Department[]>(endpoint);
    },

    async getById(id: number) {
        return await apiClient.get<Department>(`/departments/${id}`);
    },

    async create(data: DepartmentFormData) {
        return await apiClient.post<Department>('/departments', data);
    },

    async update(id: number, data: Partial<DepartmentFormData & { is_active: boolean }>) {
        return await apiClient.put<Department>(`/departments/${id}`, data);
    },

    async remove(id: number) {
        return await apiClient.delete(`/departments/${id}`);
    },
};
