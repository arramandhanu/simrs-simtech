import { apiClient } from './apiClient';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
    createdAt?: string;
}

export interface Role {
    value: string;
    label: string;
}

export interface CreateUserData {
    email: string;
    password: string;
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

export const userService = {
    async getAllUsers(): Promise<{ success: boolean; data: User[] }> {
        const response = await apiClient.get('/users');
        return response.data;
    },

    async getUserById(id: string): Promise<{ success: boolean; data: User }> {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },

    async createUser(data: CreateUserData): Promise<{ success: boolean; data: User; message: string }> {
        const response = await apiClient.post('/users', data);
        return response.data;
    },

    async updateUser(id: string, data: UpdateUserData): Promise<{ success: boolean; data: User; message: string }> {
        const response = await apiClient.put(`/users/${id}`, data);
        return response.data;
    },

    async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    },

    async getRoles(): Promise<{ success: boolean; data: Role[] }> {
        const response = await apiClient.get('/users/roles');
        return response.data;
    }
};
