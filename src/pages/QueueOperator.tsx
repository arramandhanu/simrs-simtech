import { useEffect, useState, useCallback } from "react";
import {
    UserPlus,
    PhoneCall,
    SkipForward,
    Check,
    RefreshCw,
} from "lucide-react";
import { queueService } from "../services/queueService";
import { departmentService } from "../services/departmentService";
import { counterService } from "../services/counterService";
import { ttsService } from "../services/ttsService";
import type {
    QueueItem,
    QueueStats,
    Department,
    Counter,
    QueuePriority,
    QueueEvent,
} from "../types/queue";

// ---------- Constants ----------

const PRIORITY_LABELS: Record<QueuePriority, string> = {
    normal: "Normal",
    elderly: "Lansia",
    emergency: "Darurat",
};

const PRIORITY_COLORS: Record<QueuePriority, string> = {
    normal: "bg-slate-100 text-slate-700",
    elderly: "bg-amber-100 text-amber-700",
    emergency: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
    waiting: "bg-blue-100 text-blue-700",
    called: "bg-yellow-100 text-yellow-700",
    serving: "bg-green-100 text-green-700",
    completed: "bg-slate-100 text-slate-500",
    skipped: "bg-red-100 text-red-500",
};

const TAB_LIST = ["Daftar Antrian", "Loket Saya", "Riwayat"] as const;
type TabName = (typeof TAB_LIST)[number];

// ---------- Main Component ----------

const QueueOperator = () => {
    const [activeTab, setActiveTab] = useState<TabName>("Daftar Antrian");
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Registration form state
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [registerName, setRegisterName] = useState("");
    const [registerDepartment, setRegisterDepartment] = useState<number>(0);
    const [registerPriority, setRegisterPriority] = useState<QueuePriority>("normal");

    // ---------- Data Fetching ----------

    const fetchQueue = useCallback(async () => {
        const res = await queueService.getActiveQueue(selectedDepartment);
        if (res.success) setQueue(res.data);
    }, [selectedDepartment]);

    const fetchStats = useCallback(async () => {
        const res = await queueService.getStats(selectedDepartment);
        if (res.success) setStats(res.data);
    }, [selectedDepartment]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [deptRes, counterRes] = await Promise.all([
                departmentService.getAll(true),
                counterService.getAll(),
            ]);
            if (deptRes.success) setDepartments(deptRes.data);
            if (counterRes.success) setCounters(counterRes.data);
            await Promise.all([fetchQueue(), fetchStats()]);
        } catch (error) {
            console.error("Failed to load queue data:", error);
        } finally {
            setLoading(false);
        }
    }, [fetchQueue, fetchStats]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Refresh queue when department filter changes
    useEffect(() => {
        if (!loading) {
            fetchQueue();
            fetchStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDepartment]);

    // ---------- WebSocket for Real-Time Updates ----------

    useEffect(() => {
        const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${import.meta.env.VITE_WS_PORT || "5000"}/ws`;
        let ws: WebSocket | null = null;

        try {
            ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                const message: QueueEvent = JSON.parse(event.data);
                if (message.type.startsWith("queue:")) {
                    // Refresh data on any queue event
                    fetchQueue();
                    fetchStats();
                }
            };

            ws.onerror = () => {
                console.warn("WebSocket connection failed. Using polling fallback.");
            };
        } catch {
            console.warn("WebSocket not available.");
        }

        // Polling fallback (every 10s)
        const interval = setInterval(() => {
            fetchQueue();
            fetchStats();
        }, 10000);

        return () => {
            ws?.close();
            clearInterval(interval);
        };
    }, [fetchQueue, fetchStats]);

    // ---------- TTS Voice Call ----------

    const speakQueueCall = async (item: QueueItem) => {
        try {
            const res = await ttsService.generateCallText(item.id, "id");
            if (res.success && res.data.text) {
                const utterance = new SpeechSynthesisUtterance(res.data.text);
                utterance.lang = "id-ID";
                utterance.rate = 0.9;
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error("TTS error:", error);
        }
    };

    // ---------- Queue Actions ----------

    const handleCallNext = async (counterId: number) => {
        setActionLoading(-1);
        const res = await queueService.callNext(counterId);
        setActionLoading(null);

        if (res.success && res.data) {
            await speakQueueCall(res.data);
            await fetchQueue();
            await fetchStats();
        }
    };

    const handleRecall = async (item: QueueItem) => {
        setActionLoading(item.id);
        const res = await queueService.recallPatient(item.id);
        setActionLoading(null);

        if (res.success && res.data) {
            await speakQueueCall(res.data);
            await fetchQueue();
        }
    };

    const handleSkip = async (id: number) => {
        setActionLoading(id);
        await queueService.skipPatient(id);
        setActionLoading(null);
        await fetchQueue();
        await fetchStats();
    };

    const handleServe = async (id: number) => {
        setActionLoading(id);
        await queueService.servePatient(id);
        setActionLoading(null);
        await fetchQueue();
        await fetchStats();
    };

    const handleComplete = async (id: number) => {
        setActionLoading(id);
        await queueService.completePatient(id);
        setActionLoading(null);
        await fetchQueue();
        await fetchStats();
    };

    // ---------- Registration ----------

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerDepartment) return;

        await queueService.registerPatient({
            patient_name: registerName || undefined,
            department_id: registerDepartment,
            priority: registerPriority,
        });

        setRegisterName("");
        setRegisterPriority("normal");
        setShowRegisterForm(false);
        await fetchQueue();
        await fetchStats();
    };

    // ---------- Render Helpers ----------

    const waitingItems = queue.filter((q) => q.status === "waiting");
    const calledItems = queue.filter((q) => q.status === "called" || q.status === "serving");
    const completedItems = queue.filter((q) => q.status === "completed" || q.status === "skipped");

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Memuat data antrian...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Antrian Pasien</h1>
                    <p className="text-slate-500">Kelola antrian pasien rumah sakit</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchQueue(); fetchStats(); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowRegisterForm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-medical-600 rounded-lg hover:bg-medical-700 transition-colors"
                    >
                        <UserPlus size={16} />
                        Daftarkan Pasien
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Menunggu" value={stats.total_waiting} color="text-blue-600" bg="bg-blue-50" />
                    <StatCard label="Dipanggil" value={stats.total_called} color="text-yellow-600" bg="bg-yellow-50" />
                    <StatCard label="Selesai" value={stats.total_served} color="text-green-600" bg="bg-green-50" />
                    <StatCard label="Rata-rata Tunggu" value={`${stats.avg_wait_minutes} mnt`} color="text-slate-600" bg="bg-slate-50" />
                </div>
            )}

            {/* Department Filter */}
            <div className="flex items-center gap-3">
                <select
                    value={selectedDepartment || ""}
                    onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                >
                    <option value="">Semua Departemen</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-1">
                    {TAB_LIST.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? "border-medical-600 text-medical-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "Daftar Antrian" && (
                <div className="space-y-4">
                    {/* Currently Called */}
                    {calledItems.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Sedang Dipanggil</h3>
                            <div className="space-y-2">
                                {calledItems.map((item) => (
                                    <QueueRow
                                        key={item.id}
                                        item={item}
                                        loading={actionLoading === item.id}
                                        onRecall={() => handleRecall(item)}
                                        onSkip={() => handleSkip(item.id)}
                                        onServe={() => handleServe(item.id)}
                                        onComplete={() => handleComplete(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Waiting */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                            Menunggu ({waitingItems.length})
                        </h3>
                        {waitingItems.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Tidak ada pasien dalam antrian.</p>
                        ) : (
                            <div className="space-y-2">
                                {waitingItems.map((item) => (
                                    <QueueRow
                                        key={item.id}
                                        item={item}
                                        loading={actionLoading === item.id}
                                        onSkip={() => handleSkip(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "Loket Saya" && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Pilih Loket</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {counters.map((counter) => (
                            <div
                                key={counter.id}
                                className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">{counter.name}</p>
                                        <p className="text-xs text-slate-500">{counter.department_name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${counter.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-slate-100 text-slate-500"
                                        }`}>
                                        {counter.status}
                                    </span>
                                </div>
                                {counter.operator_name && (
                                    <p className="text-xs text-slate-500 mb-3">Operator: {counter.operator_name}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCallNext(counter.id)}
                                        disabled={actionLoading === -1}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-medical-600 rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors"
                                    >
                                        <PhoneCall size={14} />
                                        Panggil Selanjutnya
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {counters.length === 0 && (
                        <p className="text-center text-slate-400 py-8">
                            Belum ada loket. Tambahkan melalui menu Settings.
                        </p>
                    )}
                </div>
            )}

            {activeTab === "Riwayat" && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                        Riwayat Hari Ini ({completedItems.length})
                    </h3>
                    {completedItems.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">Belum ada pasien yang selesai dilayani.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="py-3 px-4 font-medium">No. Antrian</th>
                                        <th className="py-3 px-4 font-medium">Nama</th>
                                        <th className="py-3 px-4 font-medium">Departemen</th>
                                        <th className="py-3 px-4 font-medium">Prioritas</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Selesai</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedItems.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="py-3 px-4 font-mono font-bold">{item.queue_number}</td>
                                            <td className="py-3 px-4">{item.patient_name || "-"}</td>
                                            <td className="py-3 px-4">{item.department_name || "-"}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[item.priority]}`}>
                                                    {PRIORITY_LABELS[item.priority]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status]}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {item.completed_at ? new Date(item.completed_at).toLocaleTimeString("id-ID") : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Registration Modal */}
            {showRegisterForm && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Daftarkan Pasien ke Antrian</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Pasien (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={registerName}
                                    onChange={(e) => setRegisterName(e.target.value)}
                                    placeholder="Masukkan nama pasien"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Departemen *
                                </label>
                                <select
                                    value={registerDepartment}
                                    onChange={(e) => setRegisterDepartment(Number(e.target.value))}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                                >
                                    <option value={0} disabled>Pilih departemen</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Prioritas
                                </label>
                                <div className="flex gap-3">
                                    {(Object.keys(PRIORITY_LABELS) as QueuePriority[]).map((p) => (
                                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={p}
                                                checked={registerPriority === p}
                                                onChange={() => setRegisterPriority(p)}
                                                className="text-medical-600 focus:ring-medical-500"
                                            />
                                            <span className="text-sm">{PRIORITY_LABELS[p]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterForm(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!registerDepartment}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-medical-600 rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors"
                                >
                                    Daftarkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------- Sub Components ----------

function StatCard({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
    return (
        <div className={`${bg} rounded-xl p-4`}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function QueueRow({
    item,
    loading,
    onRecall,
    onSkip,
    onServe,
    onComplete,
}: {
    item: QueueItem;
    loading: boolean;
    onRecall?: () => void;
    onSkip?: () => void;
    onServe?: () => void;
    onComplete?: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
                {/* Queue Number */}
                <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-xl">
                    <span className="text-lg font-mono font-bold text-slate-800">{item.queue_number}</span>
                </div>
                {/* Info */}
                <div>
                    <p className="font-medium text-slate-800">{item.patient_name || "Pasien"}</p>
                    <p className="text-xs text-slate-500">{item.department_name || "-"}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[item.priority]}`}>
                            {PRIORITY_LABELS[item.priority]}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status]}`}>
                            {item.status}
                        </span>
                        {item.counter_name && (
                            <span className="text-xs text-slate-500">@ {item.counter_name}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {item.status === "called" && onServe && (
                    <ActionButton label="Layani" icon={<Check size={14} />} onClick={onServe} disabled={loading} color="bg-green-600 hover:bg-green-700" />
                )}
                {(item.status === "called" || item.status === "serving") && onRecall && (
                    <ActionButton label="Panggil Ulang" icon={<PhoneCall size={14} />} onClick={onRecall} disabled={loading} color="bg-blue-600 hover:bg-blue-700" />
                )}
                {(item.status === "called" || item.status === "serving") && onComplete && (
                    <ActionButton label="Selesai" icon={<Check size={14} />} onClick={onComplete} disabled={loading} color="bg-green-600 hover:bg-green-700" />
                )}
                {item.status !== "completed" && item.status !== "skipped" && onSkip && (
                    <ActionButton label="Lewati" icon={<SkipForward size={14} />} onClick={onSkip} disabled={loading} color="bg-slate-500 hover:bg-slate-600" />
                )}
            </div>
        </div>
    );
}

function ActionButton({
    label,
    icon,
    onClick,
    disabled,
    color,
}: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
    color: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${color}`}
            title={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

export default QueueOperator;
