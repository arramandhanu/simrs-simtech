import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield, Check, X, Clock, UserCheck } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role, CreateUserData, UpdateUserData } from '../services/userService';
import { useRole } from '../components/auth/RoleGuard';

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
    const [pendingCount, setPendingCount] = useState(0);
    const { isAdmin } = useRole();

    // Form state
    const [formData, setFormData] = useState<CreateUserData & UpdateUserData>({
        email: '',
        password: '',
        name: '',
        role: 'user',
        position: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        fetchPendingCount();
    }, []);

    const fetchData = async () => {
        console.log('[Users] === fetchData START ===');
        try {
            setLoading(true);
            setError(null);
            const statusFilter = activeTab === 'all' ? undefined : activeTab;
            console.log('[Users] Filter:', statusFilter);

            const [usersRes, rolesRes] = await Promise.all([
                userService.getAllUsers(statusFilter),
                userService.getRoles()
            ]);

            console.log('[Users] Raw usersRes:', usersRes);

            // Handle both wrapped {success, data} and direct array responses
            let usersData: User[] = [];
            if (Array.isArray(usersRes)) {
                // Response is already the array
                usersData = usersRes;
                console.log('[Users] Response was array, length:', usersData.length);
            } else if (usersRes && usersRes.success && usersRes.data) {
                // Response is wrapped
                usersData = usersRes.data;
                console.log('[Users] Response was wrapped, length:', usersData.length);
            } else if (usersRes && usersRes.data && Array.isArray(usersRes.data)) {
                // Response has data but no success flag
                usersData = usersRes.data;
                console.log('[Users] Response had data array, length:', usersData.length);
            }

            console.log('[Users] Setting users:', usersData.length);
            setUsers(usersData);

            // Handle roles similarly
            let rolesData: Role[] = [];
            if (Array.isArray(rolesRes)) {
                rolesData = rolesRes;
            } else if (rolesRes && rolesRes.data) {
                rolesData = rolesRes.data;
            }
            setRoles(rolesData);

        } catch (err) {
            console.error('[Users] CATCH ERROR:', err);
            setError('Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
            console.log('[Users] === fetchData END ===');
        }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await userService.getPendingCount();
            // Handle both wrapped and direct response
            if (res && res.success && res.data) {
                setPendingCount(res.data.count);
            } else {
                // Try as unwrapped response
                const unwrapped = res as unknown as { count?: number };
                if (unwrapped && typeof unwrapped.count === 'number') {
                    setPendingCount(unwrapped.count);
                }
            }
        } catch (err) {
            console.error('Failed to fetch pending count', err);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                password: '',
                name: user.name,
                role: user.role,
                position: user.position || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                name: '',
                role: 'user',
                position: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
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
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleApprove = async (user: User, role?: string) => {
        try {
            await userService.approveUser(user.id, role);
            setSuccess(`${user.name || user.email} approved successfully`);
            fetchData();
            fetchPendingCount();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleReject = async (user: User) => {
        if (!confirm(`Are you sure you want to reject ${user.name || user.email}?`)) return;
        try {
            await userService.rejectUser(user.id);
            setSuccess(`${user.name || user.email} rejected`);
            fetchData();
            fetchPendingCount();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to reject user');
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
        try {
            await userService.deleteUser(user.id);
            setSuccess('User deleted');
            fetchData();
            fetchPendingCount();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-100 text-red-800',
            doctor: 'bg-blue-100 text-blue-800',
            nurse: 'bg-green-100 text-green-800',
            staff: 'bg-yellow-100 text-yellow-800',
            readonly: 'bg-gray-100 text-gray-800',
            user: 'bg-slate-100 text-slate-800'
        };
        return colors[role] || colors.user;
    };

    const getStatusBadge = (status?: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            suspended: 'bg-gray-100 text-gray-800'
        };
        return colors[status || 'pending'] || colors.pending;
    };

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

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-1 border-b-2 font-medium transition ${activeTab === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    All Users
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 ${activeTab === 'pending'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Clock size={16} />
                    Pending Approval
                    {pendingCount > 0 && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`pb-3 px-1 border-b-2 font-medium transition flex items-center gap-2 ${activeTab === 'approved'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <UserCheck size={16} />
                    Approved
                </button>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                        {activeTab === 'pending' ? 'No pending users' : 'No users found'}
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
                            {users.map((user) => (
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                                            {user.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-slate-500">
                                            {user.keycloakId ? 'SSO' : 'Local'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {user.status === 'pending' && (
                                                <>
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
                </div>
            )}

            {/* Modal */}
            {showModal && (
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
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
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
