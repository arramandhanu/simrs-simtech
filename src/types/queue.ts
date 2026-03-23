/**
 * Queue Management Types
 * Type definitions for the patient queue voice manager feature.
 */

// ---------- Department ----------

export interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DepartmentFormData {
    name: string;
    code: string;
    description?: string;
}

// ---------- Counter ----------

export interface Counter {
    id: number;
    department_id: number;
    name: string;
    code: string;
    operator_id: number | null;
    status: 'active' | 'inactive' | 'paused';
    department_name?: string;
    operator_name?: string;
    created_at: string;
    updated_at: string;
}

export interface CounterFormData {
    department_id: number;
    name: string;
    code: string;
}

// ---------- Queue Item ----------

export type QueuePriority = 'normal' | 'elderly' | 'emergency';
export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'skipped';

export interface QueueItem {
    id: number;
    queue_number: string;
    patient_name: string | null;
    department_id: number;
    counter_id: number | null;
    priority: QueuePriority;
    status: QueueStatus;
    called_at: string | null;
    served_at: string | null;
    completed_at: string | null;
    created_at: string;
    department_name?: string;
    department_code?: string;
    counter_name?: string;
}

export interface QueueRegisterData {
    patient_name?: string;
    department_id: number;
    priority?: QueuePriority;
}

export interface QueueStats {
    total_served: number;
    total_waiting: number;
    total_called: number;
    total_skipped: number;
    avg_wait_minutes: number;
    by_status: Record<string, number>;
}

export interface DisplayBoardData {
    now_serving: QueueItem[];
    next_up: QueueItem[];
    waiting_count: number;
}

// ---------- Voice Template ----------

export interface VoiceTemplate {
    id: number;
    language: string;
    template_text: string;
    description: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface VoiceTemplateFormData {
    language?: string;
    template_text: string;
    description?: string;
    is_default?: boolean;
}

// ---------- Clinic Schedule ----------

export interface ClinicSchedule {
    id: number;
    department_id: number;
    day_of_week: number; // 0 = Sunday, 6 = Saturday
    open_time: string | null;
    close_time: string | null;
    is_active: boolean;
    department_name?: string;
}

export interface ClinicScheduleFormData {
    department_id: number;
    day_of_week: number;
    open_time?: string;
    close_time?: string;
    is_active?: boolean;
}

// ---------- WebSocket Events ----------

export type QueueEventType =
    | 'connected'
    | 'queue:registered'
    | 'queue:called'
    | 'queue:recalled'
    | 'queue:served'
    | 'queue:skipped'
    | 'queue:completed';

export interface QueueEvent {
    type: QueueEventType;
    data?: QueueItem;
    message?: string;
    timestamp?: string;
}
