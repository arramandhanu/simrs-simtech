import { apiClient } from './apiClient';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
    status?: string;
    keycloakId?: string;
    approvedAt?: string;
    createdAt?: string;
}

export interface Role {
    value: string;
    label: string;
}

export interface Status {
    value: string;
    label: string;
}

export interface CreateUserData {
    email: string;
    password?: string;
    name?: string;
    role?: string;
    position?: string;
}

export interface UpdateUserData {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    position?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const userService = {
    async getAllUsers(status?: string): Promise<ApiResponse<User[]>> {
        const url = status ? `/users?status=${status}` : '/users';
        const response = await apiClient.get<ApiResponse<User[]>>(url);
        return response.data;
    },

    async getPendingCount(): Promise<ApiResponse<{ count: number }>> {
        const response = await apiClient.get<ApiResponse<{ count: number }>>('/users/pending/count');
        return response.data;
    },

    async getUserById(id: string): Promise<ApiResponse<User>> {
        const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
        return response.data;
    },

    async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
        const response = await apiClient.post<ApiResponse<User>>('/users', data);
        return response.data;
    },

    async approveUser(id: string, role?: string): Promise<ApiResponse<User>> {
        const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/approve`, { role });
        return response.data;
    },

    async rejectUser(id: string): Promise<ApiResponse<User>> {
        const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/reject`, {});
        return response.data;
    },

    async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
        const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
        return response.data;
    },

    async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
        return response.data;
    },

    async getRoles(): Promise<ApiResponse<Role[]>> {
        const response = await apiClient.get<ApiResponse<Role[]>>('/users/roles');
        return response.data;
    },

    async getStatuses(): Promise<ApiResponse<Status[]>> {
        const response = await apiClient.get<ApiResponse<Status[]>>('/users/statuses');
        return response.data;
    }
};
