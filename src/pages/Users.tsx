import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Users as UsersIcon, Shield, Check, X,
    Clock, UserCheck, Search, ChevronLeft, ChevronRight, PauseCircle,
    CheckCircle
} from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role, CreateUserData, UpdateUserData } from '../services/userService';
import { useRole } from '../components/auth/RoleGuard';

const PAGE_SIZE = 10;

// ─── Confirmation Modal ─────────────────────────────────────────────────────
interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    confirmClass?: string;
    onConfirm: () => void;
    onCancel: () => void;
}
const ConfirmModal = ({
    title, message, confirmLabel = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700',
    onConfirm, onCancel
}: ConfirmModalProps) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition ${confirmClass}`}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

// ─── Role / Status Badge helpers ────────────────────────────────────────────
const getRoleBadgeClass = (role: string) => {
    const map: Record<string, string> = {
        admin: 'bg-red-100 text-red-800',
        doctor: 'bg-blue-100 text-blue-800',
        nurse: 'bg-green-100 text-green-800',
        staff: 'bg-yellow-100 text-yellow-800',
        readonly: 'bg-gray-100 text-gray-800',
        user: 'bg-slate-100 text-slate-800',
    };
    return map[role] || map.user;
};

const getStatusBadgeClass = (status?: string) => {
    const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        suspended: 'bg-gray-100 text-gray-500',
    };
    return map[status || 'pending'] || map.pending;
};

// ─── Main Component ─────────────────────────────────────────────────────────
type TabType = 'all' | 'pending' | 'approved';

const UsersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useRole();

    // ── State ──
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Read initial tab from URL query param (?tab=pending)
    const initialTab = (searchParams.get('tab') as TabType) || 'all';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    const [pendingCount, setPendingCount] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Modal state
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        title: string; message: string; confirmLabel?: string; confirmClass?: string; onConfirm: () => void;
    } | null>(null);

    // Approve-with-role: store pending role selection per user id
    const [approveRoleMap, setApproveRoleMap] = useState<Record<string, string>>({});

    // Form state
    const [formData, setFormData] = useState<CreateUserData & UpdateUserData>({
        email: '', password: '', name: '', role: 'user', position: ''
    });

    // ── Sync tab → URL ──
    const switchTab = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1);
        setSearchParams(tab === 'all' ? {} : { tab });
    };

    // ── Data fetching ──
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const statusFilter = activeTab === 'all' ? undefined : activeTab;

            const [usersRes, rolesRes] = await Promise.all([
                userService.getAllUsers(statusFilter),
                userService.getRoles(),
            ]);

            // Normalise response (wrapped or direct array)
            const normalise = <T,>(res: unknown): T[] => {
                if (Array.isArray(res)) return res as T[];
                const r = res as { success?: boolean; data?: T[] };
                if (r?.data && Array.isArray(r.data)) return r.data;
                return [];
            };

            setUsers(normalise<User>(usersRes));
            setRoles(normalise<Role>(rolesRes));
        } catch {
            setError('Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const fetchPendingCount = useCallback(async () => {
        try {
            const res = await userService.getPendingCount();
            const count = res?.data?.count ?? (res as unknown as { count?: number })?.count ?? 0;
            setPendingCount(count);
        } catch {
            // silently ignore
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);

    // Listen for TopBar quick-approve events to stay in sync
    useEffect(() => {
        const handler = () => { fetchData(); fetchPendingCount(); };
        window.addEventListener('user:approved', handler);
        return () => window.removeEventListener('user:approved', handler);
    }, [fetchData, fetchPendingCount]);

    // ── Filtered + paginated list ──
    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ── Actions ──
    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({ email: user.email, password: '', name: user.name, role: user.role, position: user.position || '' });
        } else {
            setEditingUser(null);
            setFormData({ email: '', password: '', name: '', role: 'user', position: '' });
        }
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'user', position: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updateData: UpdateUserData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await userService.updateUser(editingUser.id, updateData);
                setSuccess('User updated successfully');
            } else {
                await userService.createUser(formData as CreateUserData);
                setSuccess('User created successfully');
            }
            handleCloseModal();
            fetchData();
            fetchPendingCount();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Operation failed');
        }
    };

    const handleApprove = async (user: User) => {
        const role = approveRoleMap[user.id] || user.role || 'user';
        try {
            await userService.approveUser(user.id, role);
            setSuccess(`${user.name || user.email} approved`);
            window.dispatchEvent(new Event('user:approved'));
            fetchData();
            fetchPendingCount();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleReject = (user: User) => {
        setConfirmModal({
            title: 'Reject User',
            message: `Reject access for ${user.name || user.email}? They will not be able to log in.`,
            confirmLabel: 'Reject',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await userService.rejectUser(user.id);
                    setSuccess(`${user.name || user.email} rejected`);
                    fetchData();
                    fetchPendingCount();
                } catch (err: unknown) {
                    const e = err as { response?: { data?: { message?: string } } };
                    setError(e.response?.data?.message || 'Failed to reject user');
                }
            },
        });
    };

    const handleSuspend = (user: User) => {
        setConfirmModal({
            title: 'Suspend User',
            message: `Suspend ${user.name || user.email}? They will be unable to log in until reinstated.`,
            confirmLabel: 'Suspend',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await userService.suspendUser(user.id);
                    setSuccess(`${user.name || user.email} suspended`);
                    fetchData();
                } catch (err: unknown) {
                    const e = err as { response?: { data?: { message?: string } } };
                    setError(e.response?.data?.message || 'Failed to suspend user');
                }
            },
        });
    };

    const handleDelete = (user: User) => {
        setConfirmModal({
            title: 'Delete User',
            message: `Permanently delete ${user.name || user.email}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await userService.deleteUser(user.id);
                    setSuccess('User deleted');
                    fetchData();
                    fetchPendingCount();
                } catch (err: unknown) {
                    const e = err as { response?: { data?: { message?: string } } };
                    setError(e.response?.data?.message || 'Failed to delete user');
                }
            },
        });
    };

    // ── Access guard ──
    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800">Access Denied</h2>
                <p className="text-slate-500">You need administrator privileges to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmLabel={confirmModal.confirmLabel}
                    confirmClass={confirmModal.confirmClass}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UsersIcon className="w-7 h-7" />
                        User Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex justify-between items-center">
                    {error}
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex justify-between items-center">
                    {success}
                    <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">×</button>
                </div>
            )}

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex gap-4 border-b border-slate-200 sm:border-b-0">
                    <button
                        onClick={() => switchTab('all')}
                        className={`pb-3 px-1 border-b-2 font-medium transition ${activeTab === 'all'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        All Users
                    </button>
                    <button
                        onClick={() => switchTab('pending')}
                        className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 ${activeTab === 'pending'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock size={16} />
                        Pending
                        {pendingCount > 0 && (
                            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => switchTab('approved')}
                        className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 ${activeTab === 'approved'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserCheck size={16} />
                        Approved
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-full sm:w-64">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder-slate-400"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-slate-500 mt-2">Loading users...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                        {search ? `No users matching "${search}"` : activeTab === 'pending' ? 'No pending users' : 'No users found'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium text-slate-600">User</th>
                                <th className="text-left p-4 font-medium text-slate-600">Role</th>
                                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                                <th className="text-left p-4 font-medium text-slate-600">Source</th>
                                <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((user) => (
                                <tr key={user.id} className="border-b hover:bg-slate-50">
                                    <td className="p-4">
                                        <div>
                                            <div className="font-medium text-slate-900">{user.name || 'No name'}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                            {user.position && (
                                                <div className="text-xs text-slate-400">{user.position}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(user.status)}`}>
                                            {user.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-slate-500">
                                            {user.keycloakId ? 'SSO' : 'Local'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {user.status === 'pending' && (
                                                <>
                                                    {/* Approve with role selector */}
                                                    <select
                                                        value={approveRoleMap[user.id] || user.role || 'user'}
                                                        onChange={(e) => setApproveRoleMap(prev => ({ ...prev, [user.id]: e.target.value }))}
                                                        className="text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:ring-1 focus:ring-blue-400"
                                                        title="Role to assign on approval"
                                                    >
                                                        {roles.map((r) => (
                                                            <option key={r.value} value={r.value}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleApprove(user)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'approved' && (
                                                <button
                                                    onClick={() => handleSuspend(user)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                    title="Suspend"
                                                >
                                                    <PauseCircle size={18} />
                                                </button>
                                            )}
                                            {user.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Reinstate"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <p className="text-sm text-slate-500">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1 rounded-lg text-sm transition ${page === p
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add / Edit User Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@hospital.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="••••••••"
                                    required={!editingUser}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Doctor, Nurse, etc."
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
