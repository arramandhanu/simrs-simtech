import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Users as UsersIcon, Shield, Check, X,
    Clock, UserCheck, Search, ChevronLeft, ChevronRight,
    PauseCircle, CheckCircle, Fingerprint, Globe
} from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role, CreateUserData, UpdateUserData } from '../services/userService';
import { useRole } from '../components/auth/RoleGuard';

const PAGE_SIZE = 10;

// ─── Styled Confirm Modal ────────────────────────────────────────────────────
interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}
const ConfirmModal = ({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }: ConfirmModalProps) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className={`h-1.5 ${danger ? 'bg-red-500' : 'bg-blue-500'}`} />
            <div className="p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-1">{title}</h2>
                <p className="text-sm text-slate-500 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    </div>
);

// ─── Avatar initials ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-amber-500', 'bg-sky-500', 'bg-indigo-500', 'bg-pink-500'
];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

// ─── Badge helpers ────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    admin:    { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Administrator' },
    doctor:   { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Doctor' },
    nurse:    { bg: 'bg-green-50',   text: 'text-green-700',   label: 'Nurse' },
    staff:    { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'Staff' },
    readonly: { bg: 'bg-slate-100',  text: 'text-slate-600',   label: 'Read Only' },
    user:     { bg: 'bg-slate-100',  text: 'text-slate-600',   label: 'User' },
};
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
    approved:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
    rejected:  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
    suspended: { bg: 'bg-slate-100', text: 'text-slate-500',  dot: 'bg-slate-400' },
};

const RoleBadge = ({ role }: { role: string }) => {
    const s = ROLE_STYLES[role] || ROLE_STYLES.user;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
};
const StatusBadge = ({ status }: { status?: string }) => {
    const s = STATUS_STYLES[status || 'pending'] || STATUS_STYLES.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {(status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1)}
        </span>
    );
};

// ─── Input field shared style ─────────────────────────────────────────────────
const inputCls = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition placeholder:text-slate-400";

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabType = 'all' | 'pending' | 'approved';

const UsersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useRole();

    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const initialTab = (searchParams.get('tab') as TabType) || 'all';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [pendingCount, setPendingCount] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void;
    } | null>(null);
    const [approveRoleMap, setApproveRoleMap] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateUserData & UpdateUserData>({
        email: '', password: '', name: '', role: 'user', position: ''
    });

    const switchTab = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1);
        setSearchParams(tab === 'all' ? {} : { tab });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const statusFilter = activeTab === 'all' ? undefined : activeTab;
            const [usersRes, rolesRes] = await Promise.all([
                userService.getAllUsers(statusFilter),
                userService.getRoles(),
            ]);
            const normalise = <T,>(res: unknown): T[] => {
                if (Array.isArray(res)) return res as T[];
                const r = res as { data?: T[] };
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
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);
    useEffect(() => {
        const handler = () => { fetchData(); fetchPendingCount(); };
        window.addEventListener('user:approved', handler);
        return () => window.removeEventListener('user:approved', handler);
    }, [fetchData, fetchPendingCount]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    const handleCloseModal = () => { setShowFormModal(false); setEditingUser(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const d: UpdateUserData = { ...formData };
                if (!d.password) delete d.password;
                await userService.updateUser(editingUser.id, d);
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
            fetchData(); fetchPendingCount();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = (user: User) => setConfirmModal({
        title: 'Reject User', danger: true,
        message: `Reject access for ${user.name || user.email}? They won't be able to log in.`,
        confirmLabel: 'Reject',
        onConfirm: async () => {
            setConfirmModal(null);
            try { await userService.rejectUser(user.id); setSuccess(`${user.name || user.email} rejected`); fetchData(); fetchPendingCount(); }
            catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; setError(e.response?.data?.message || 'Failed'); }
        },
    });

    const handleSuspend = (user: User) => setConfirmModal({
        title: 'Suspend User', danger: true,
        message: `Suspend ${user.name || user.email}? They won't be able to log in until reinstated.`,
        confirmLabel: 'Suspend',
        onConfirm: async () => {
            setConfirmModal(null);
            try { await userService.updateUser(user.id, { }); setSuccess(`${user.name || user.email} suspended`); fetchData(); }
            catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; setError(e.response?.data?.message || 'Failed'); }
        },
    });

    const handleDelete = (user: User) => setConfirmModal({
        title: 'Delete User', danger: true,
        message: `Permanently delete ${user.name || user.email}? This cannot be undone.`,
        confirmLabel: 'Delete',
        onConfirm: async () => {
            setConfirmModal(null);
            try { await userService.deleteUser(user.id); setSuccess('User deleted'); fetchData(); fetchPendingCount(); }
            catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; setError(e.response?.data?.message || 'Failed'); }
        },
    });

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Shield className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-1">Access Restricted</h2>
                <p className="text-slate-400 text-sm">You need administrator privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title} message={confirmModal.message}
                    confirmLabel={confirmModal.confirmLabel} danger={confirmModal.danger}
                    onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)}
                />
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                        <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                        <p className="text-sm text-slate-400">Manage accounts, roles, and access</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            {/* ── Alerts ── */}
            {error && (
                <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                    <X size={16} className="shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm">
                    <Check size={16} className="shrink-0" />
                    <span className="flex-1">{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600 transition">×</button>
                </div>
            )}

            {/* ── Toolbar: Tabs + Search ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                {/* Pill-style tab switcher */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {([
                        { key: 'all' as const, label: 'All Users', icon: UsersIcon, count: undefined as number | undefined },
                        { key: 'pending' as const, label: 'Pending', icon: Clock, count: pendingCount as number | undefined },
                        { key: 'approved' as const, label: 'Approved', icon: UserCheck, count: undefined as number | undefined },
                    ]).map(({ key, label, icon: Icon, count }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon size={15} />
                            {label}
                            {count !== undefined && count > 0 && (
                                <span className="ml-0.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 max-w-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition">
                    <Search size={15} className="text-slate-400 shrink-0" />
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

                {/* Count */}
                <p className="text-sm text-slate-400 ml-auto hidden sm:block">
                    {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
                </p>
            </div>

            {/* ── Table Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                        <p className="text-sm text-slate-400">Loading users...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <UsersIcon className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {search ? `No results for "${search}"` : activeTab === 'pending' ? 'No pending users' : 'No users found'}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginated.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                                        {/* User cell */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(user.name || user.email)}`}>
                                                    {getInitials(user.name || user.email)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{user.name || 'Unnamed'}</p>
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                    {user.position && <p className="text-xs text-slate-300 mt-0.5">{user.position}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role cell */}
                                        <td className="px-4 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        {/* Status cell */}
                                        <td className="px-4 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        {/* Source cell */}
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                {user.keycloakId
                                                    ? <><Globe size={13} className="text-indigo-400" /> SSO</>
                                                    : <><Fingerprint size={13} className="text-slate-400" /> Local</>}
                                            </span>
                                        </td>
                                        {/* Actions cell */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {user.status === 'pending' && (
                                                    <>
                                                        {/* Role picker */}
                                                        <select
                                                            value={approveRoleMap[user.id] || user.role || 'user'}
                                                            onChange={(e) => setApproveRoleMap(prev => ({ ...prev, [user.id]: e.target.value }))}
                                                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:ring-1 focus:ring-blue-400 outline-none mr-1"
                                                            title="Assign role on approval"
                                                        >
                                                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                        </select>
                                                        <button onClick={() => handleApprove(user)} title="Approve"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition">
                                                            <Check size={13} /> Approve
                                                        </button>
                                                        <button onClick={() => handleReject(user)} title="Reject"
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <X size={15} />
                                                        </button>
                                                    </>
                                                )}
                                                {user.status === 'approved' && (
                                                    <button onClick={() => handleSuspend(user)} title="Suspend"
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                                                        <PauseCircle size={15} />
                                                    </button>
                                                )}
                                                {user.status === 'suspended' && (
                                                    <button onClick={() => handleApprove(user)} title="Reinstate"
                                                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                                        <CheckCircle size={15} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleOpenModal(user)} title="Edit"
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                                                    <Pencil size={15} />
                                                </button>
                                                <button onClick={() => handleDelete(user)} title="Delete"
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs text-slate-400">
                                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition">
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-7 h-7 rounded-lg text-xs font-medium transition ${page === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Add / Edit Modal ── */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{editingUser ? 'Update account details' : 'Create a new system account'}</p>
                            </div>
                            <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
                                <X size={18} />
                            </button>
                        </div>
                        {/* Modal body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={inputCls} placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                                <input type="email" value={formData.email} required
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={inputCls} placeholder="john@hospital.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Password {editingUser ? <span className="font-normal text-slate-400">(leave blank to keep)</span> : <span className="text-red-400">*</span>}
                                </label>
                                <input type="password" value={formData.password} required={!editingUser}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={inputCls} placeholder="••••••••" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
                                    <select value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className={inputCls}>
                                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Position</label>
                                    <input type="text" value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className={inputCls} placeholder="e.g. Doctor" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm">
                                    {editingUser ? 'Save Changes' : 'Create User'}
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
