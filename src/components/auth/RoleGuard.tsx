import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: string | string[];
    fallback?: ReactNode;
}

/**
 * RoleGuard - Conditionally render children based on user role
 * 
 * Usage:
 *   <RoleGuard allowedRoles="admin">
 *     <AdminOnlyContent />
 *   </RoleGuard>
 * 
 *   <RoleGuard allowedRoles={['admin', 'staff']} fallback={<p>No access</p>}>
 *     <StaffContent />
 *   </RoleGuard>
 */
export const RoleGuard = ({ children, allowedRoles, fallback = null }: RoleGuardProps) => {
    const { user } = useAuth();

    if (!user) return null;

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasAccess = roles.includes(user.role);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * useRole hook - Check user role in components
 * 
 * Usage:
 *   const { isAdmin, isDoctor, hasRole } = useRole();
 *   if (isAdmin) { ... }
 *   if (hasRole(['admin', 'staff'])) { ... }
 */
export const useRole = () => {
    const { user } = useAuth();

    const userRole: string = user?.role || '';

    return {
        role: userRole,
        isAdmin: userRole === 'admin',
        isDoctor: userRole === 'doctor',
        isNurse: userRole === 'nurse',
        isStaff: userRole === 'staff',
        isReadonly: userRole === 'readonly',
        hasRole: (roles: string | string[]) => {
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            return allowedRoles.includes(userRole);
        }
    };
};

/**
 * Role constants for use throughout the app
 */
export const ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    STAFF: 'staff',
    READONLY: 'readonly',
    USER: 'user'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
