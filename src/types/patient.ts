export type RegistrationStatus = 'Admitted' | 'Waiting' | 'Discharged';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number (e.g., #PAT-001)
  name: string;
  department: string;
  status: RegistrationStatus;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  address?: string;
  phone?: string;
}

export interface PatientFilters {
  status?: RegistrationStatus;
  search?: string;
}
