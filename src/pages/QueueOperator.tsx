import { useEffect, useState, useRef } from "react";
import {
    UserPlus,
    PhoneCall,
    SkipForward,
    Check,
    RefreshCw,
    PlayCircle,
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

const STATUS_LABELS: Record<string, string> = {
    waiting: "Menunggu",
    called: "Dipanggil",
    serving: "Dilayani",
    completed: "Selesai",
    skipped: "Dilewati",
};

const STATUS_COLORS: Record<string, string> = {
    waiting: "bg-blue-100 text-blue-700",
    called: "bg-yellow-100 text-yellow-700",
    serving: "bg-green-100 text-green-700",
    completed: "bg-slate-100 text-slate-500",
    skipped: "bg-red-100 text-red-500",
};

// Department color palette — assigned dynamically based on dept code
const DEPT_COLOR_PALETTE = [
    { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
    { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    { bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
    { bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
    { bg: "bg-rose-50", border: "border-rose-200", accent: "bg-rose-500", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
    { bg: "bg-cyan-50", border: "border-cyan-200", accent: "bg-cyan-500", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
    { bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-500", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
    { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-500", text: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
    { bg: "bg-indigo-50", border: "border-indigo-200", accent: "bg-indigo-500", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
    { bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
];

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
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Registration form state
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [registerName, setRegisterName] = useState("");
    const [registerDepartment, setRegisterDepartment] = useState<number>(0);
    const [registerPriority, setRegisterPriority] = useState<QueuePriority>("normal");

    // Department color map (built once from fetched departments)
    const deptColorMap = useRef<Record<number, typeof DEPT_COLOR_PALETTE[0]>>({});

    // ---------- Data Fetching (stable refs to avoid re-render loops) ----------

    const selectedDeptRef = useRef(selectedDepartment);
    selectedDeptRef.current = selectedDepartment;

    const fetchQueue = async () => {
        try {
            const res = await queueService.getActiveQueue(selectedDeptRef.current);
            if (res.success) setQueue(res.data);
        } catch (err) {
            console.error("Failed to fetch queue:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await queueService.getStats(selectedDeptRef.current);
            if (res.success) setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchQueue(), fetchStats()]);
        } finally {
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                const [deptRes, counterRes] = await Promise.all([
                    departmentService.getAll(true),
                    counterService.getAll(),
                ]);
                if (deptRes.success) {
                    setDepartments(deptRes.data);
                    // Build color map
                    const map: Record<number, typeof DEPT_COLOR_PALETTE[0]> = {};
                    deptRes.data.forEach((dept: Department, index: number) => {
                        map[dept.id] = DEPT_COLOR_PALETTE[index % DEPT_COLOR_PALETTE.length];
                    });
                    deptColorMap.current = map;
                }
                if (counterRes.success) setCounters(counterRes.data);
                await Promise.all([fetchQueue(), fetchStats()]);
            } catch (error) {
                console.error("Failed to load queue data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refresh when department filter changes
    useEffect(() => {
        if (!loading) {
            refreshData();
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
                    refreshData();
                }
            };
            ws.onerror = () => {
                console.warn("WebSocket connection failed. Using polling fallback.");
            };
        } catch {
            console.warn("WebSocket not available.");
        }

        // Polling fallback (every 10s)
        const interval = setInterval(refreshData, 10000);

        return () => {
            ws?.close();
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Helpers ----------

    const getDeptColor = (deptId: number) => {
        return deptColorMap.current[deptId] || DEPT_COLOR_PALETTE[0];
    };

    // Get the waiting queue for a specific counter's department
    const getCounterQueue = (counter: Counter): QueueItem[] => {
        return queue.filter(
            (q) => q.department_id === counter.department_id && (q.status === "waiting" || q.status === "called" || q.status === "serving")
        );
    };

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
        try {
            const res = await queueService.callNext(counterId);
            if (res.success && res.data) {
                await speakQueueCall(res.data);
            }
        } finally {
            setActionLoading(null);
            refreshData();
        }
    };

    const handleRecall = async (item: QueueItem) => {
        setActionLoading(item.id);
        try {
            const res = await queueService.recallPatient(item.id);
            if (res.success && res.data) {
                await speakQueueCall(res.data);
            }
        } finally {
            setActionLoading(null);
            refreshData();
        }
    };

    const handleSkip = async (id: number) => {
        setActionLoading(id);
        try {
            await queueService.skipPatient(id);
        } finally {
            setActionLoading(null);
            refreshData();
        }
    };

    const handleServe = async (id: number) => {
        setActionLoading(id);
        try {
            await queueService.servePatient(id);
        } finally {
            setActionLoading(null);
            refreshData();
        }
    };

    const handleComplete = async (id: number) => {
        setActionLoading(id);
        try {
            await queueService.completePatient(id);
        } finally {
            setActionLoading(null);
            refreshData();
        }
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
        refreshData();
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
                        onClick={refreshData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Memuat...' : 'Refresh'}
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
                    <StatCard label="Rata-rata Tunggu" value={stats.avg_wait_minutes > 0 ? `${stats.avg_wait_minutes} mnt` : '—'} color="text-slate-600" bg="bg-slate-50" />
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

            {/* ===================== Tab: Daftar Antrian ===================== */}
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
                                        deptColor={getDeptColor(item.department_id)}
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
                                        deptColor={getDeptColor(item.department_id)}
                                        loading={actionLoading === item.id}
                                        onSkip={() => handleSkip(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===================== Tab: Loket Saya ===================== */}
            {activeTab === "Loket Saya" && (
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Pilih Loket</h3>

                    {/* Group counters by department */}
                    {departments.map((dept) => {
                        const deptCounters = counters.filter((c) => c.department_id === dept.id);
                        if (deptCounters.length === 0) return null;
                        const color = getDeptColor(dept.id);

                        return (
                            <div key={dept.id} className="space-y-3">
                                {/* Department header */}
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color.accent}`} />
                                    <h4 className={`text-sm font-bold ${color.text} uppercase tracking-wide`}>{dept.name}</h4>
                                    <span className="text-xs text-slate-400">({dept.code})</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {deptCounters.map((counter) => {
                                        const counterQueue = getCounterQueue(counter);
                                        const nextWaiting = counterQueue.filter((q) => q.status === "waiting");
                                        const currentServing = counterQueue.find((q) => q.status === "called" || q.status === "serving");

                                        return (
                                            <div
                                                key={counter.id}
                                                className={`p-4 ${color.bg} border ${color.border} rounded-xl shadow-sm`}
                                            >
                                                {/* Counter header */}
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
                                                    <p className="text-xs text-slate-500 mb-2">Operator: {counter.operator_name}</p>
                                                )}

                                                {/* Currently serving patient */}
                                                {currentServing && (
                                                    <div className="mb-3 p-3 bg-white rounded-lg border border-slate-200">
                                                        <p className="text-xs text-green-600 font-semibold mb-1 uppercase">Sedang Dilayani</p>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-xs text-slate-500">No. Antrian:</span>
                                                                <span className="text-sm font-mono font-bold text-slate-800">{currentServing.queue_number}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-xs text-slate-500">Nama Pasien:</span>
                                                                <span className="text-sm text-slate-700">{currentServing.patient_name || "-"}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-xs text-slate-500">Poli:</span>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded ${color.badge}`}>{currentServing.department_name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            {currentServing.status === "called" && (
                                                                <button
                                                                    onClick={() => handleServe(currentServing.id)}
                                                                    disabled={actionLoading === currentServing.id}
                                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                                >
                                                                    <Check size={12} /> Layani
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleRecall(currentServing)}
                                                                disabled={actionLoading === currentServing.id}
                                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                <PhoneCall size={12} /> Panggil Ulang
                                                            </button>
                                                            <button
                                                                onClick={() => handleComplete(currentServing.id)}
                                                                disabled={actionLoading === currentServing.id}
                                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                <Check size={12} /> Selesai
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Waiting queue detail */}
                                                <div className="mb-3">
                                                    <p className="text-xs text-slate-500 font-semibold mb-1.5 uppercase">
                                                        Antrian Menunggu ({nextWaiting.length})
                                                    </p>
                                                    {nextWaiting.length === 0 ? (
                                                        <p className="text-xs text-slate-400 text-center py-2">Belum ada antrian</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {nextWaiting.slice(0, 5).map((q, idx) => (
                                                                <div key={q.id} className={`p-2.5 rounded-lg ${idx === 0 ? 'bg-white border border-slate-200 shadow-sm' : 'bg-white/60 border border-slate-100'}`}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-sm font-mono font-bold text-slate-800">{q.queue_number}</span>
                                                                        <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${PRIORITY_COLORS[q.priority]}`}>
                                                                            {PRIORITY_LABELS[q.priority]}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-slate-400 w-16">Nama:</span>
                                                                            <span className="text-xs text-slate-700">{q.patient_name || "-"}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-slate-400 w-16">Poli:</span>
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${color.badge}`}>{q.department_name || dept.name}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {nextWaiting.length > 5 && (
                                                                <p className="text-[10px] text-slate-400 text-center">
                                                                    +{nextWaiting.length - 5} pasien lainnya
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Call next button */}
                                                <button
                                                    onClick={() => handleCallNext(counter.id)}
                                                    disabled={actionLoading === -1 || nextWaiting.length === 0}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-medical-600 rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors"
                                                >
                                                    <PlayCircle size={16} />
                                                    {nextWaiting.length > 0
                                                        ? `Panggil Selanjutnya (${nextWaiting[0].queue_number})`
                                                        : "Tidak Ada Antrian"
                                                    }
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {counters.length === 0 && (
                        <p className="text-center text-slate-400 py-8">
                            Belum ada loket. Tambahkan melalui menu Settings.
                        </p>
                    )}
                </div>
            )}

            {/* ===================== Tab: Riwayat ===================== */}
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
                                    {completedItems.map((item) => {
                                        const deptColor = getDeptColor(item.department_id);
                                        return (
                                            <tr key={item.id} className="border-b border-slate-100">
                                                <td className="py-3 px-4 font-mono font-bold">{item.queue_number}</td>
                                                <td className="py-3 px-4">{item.patient_name || "-"}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${deptColor.badge}`}>
                                                        {item.department_name || "-"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[item.priority]}`}>
                                                        {PRIORITY_LABELS[item.priority]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status]}`}>
                                                        {STATUS_LABELS[item.status] || item.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">
                                                    {item.completed_at ? new Date(item.completed_at).toLocaleTimeString("id-ID") : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
    deptColor,
    loading,
    onRecall,
    onSkip,
    onServe,
    onComplete,
}: {
    item: QueueItem;
    deptColor: typeof DEPT_COLOR_PALETTE[0];
    loading: boolean;
    onRecall?: () => void;
    onSkip?: () => void;
    onServe?: () => void;
    onComplete?: () => void;
}) {
    return (
        <div className={`flex items-center justify-between p-4 ${deptColor.bg} border ${deptColor.border} rounded-xl shadow-sm`}>
            <div className="flex items-center gap-4">
                {/* Queue Number with dept color accent */}
                <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-xl shadow-sm">
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${deptColor.accent}`} />
                    <span className="text-lg font-mono font-bold text-slate-800">{item.queue_number}</span>
                </div>
                {/* Info */}
                <div>
                    <p className="font-medium text-slate-800">{item.patient_name || "Pasien"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${deptColor.badge}`}>
                            {item.department_name || "-"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[item.priority]}`}>
                            {PRIORITY_LABELS[item.priority]}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status] || item.status}
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
