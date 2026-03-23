import { useEffect, useState, useCallback, useRef } from "react";
import type { QueueItem, DisplayBoardData, Department, QueueEvent } from "../types/queue";

// Public API base URL (no auth required for TV display)
const PUBLIC_API = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '/api/public')
    : 'http://localhost:5000/api/public';

/**
 * QueueDisplay — Fullscreen TV Display Board
 *
 * Designed for public TV screens in hospital waiting areas.
 * Shows current serving patients, next up list, and waiting count.
 * Plays TTS audio when a patient is called.
 *
 * Route: /antrian/display (standalone, no sidebar)
 */

const QueueDisplay = () => {
    const [board, setBoard] = useState<DisplayBoardData | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastCalledItem, setLastCalledItem] = useState<QueueItem | null>(null);
    const prevServingIds = useRef<Set<number>>(new Set());

    // ---------- Data Fetching ----------

    const fetchBoard = useCallback(async () => {
        try {
            const url = selectedDepartment
                ? `${PUBLIC_API}/queue/display?department_id=${selectedDepartment}`
                : `${PUBLIC_API}/queue/display`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                const newData: DisplayBoardData = json.data;

                // Detect newly called patients for TTS
                const newServingIds = new Set(newData.now_serving.map((item) => item.id));
                const newlyCalled = newData.now_serving.find(
                    (item) => !prevServingIds.current.has(item.id) && item.status === "called"
                );

                if (newlyCalled) {
                    setLastCalledItem(newlyCalled);
                    speakCall(newlyCalled);
                }

                prevServingIds.current = newServingIds;
                setBoard(newData);
            }
        } catch (error) {
            console.error("Error fetching display board:", error);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        fetch(`${PUBLIC_API}/departments?active=true`)
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setDepartments(json.data);
            })
            .catch((err) => console.error("Error fetching departments:", err));
        fetchBoard();
    }, [fetchBoard]);

    // Clock
    useEffect(() => {
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    // ---------- WebSocket + Polling ----------

    useEffect(() => {
        const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${import.meta.env.VITE_WS_PORT || "5000"}/ws`;
        let ws: WebSocket | null = null;

        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                const message: QueueEvent = JSON.parse(event.data);
                if (message.type.startsWith("queue:")) {
                    fetchBoard();
                }
            };
        } catch {
            // WebSocket not available
        }

        // Polling fallback
        const interval = setInterval(fetchBoard, 5000);

        return () => {
            ws?.close();
            clearInterval(interval);
        };
    }, [fetchBoard]);

    // ---------- TTS ----------

    const speakCall = (item: QueueItem) => {
        // Generate TTS text locally (no auth-protected API call needed)
        const text = `Nomor antrian ${item.queue_number}, silakan menuju ${item.counter_name || 'loket'}.`;

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "id-ID";
            utterance.rate = 0.85;
            utterance.volume = 1;
            speechSynthesis.speak(utterance);

            // Repeat after 3 seconds
            setTimeout(() => {
                const repeatUtterance = new SpeechSynthesisUtterance(text);
                repeatUtterance.lang = "id-ID";
                repeatUtterance.rate = 0.85;
                repeatUtterance.volume = 1;
                speechSynthesis.speak(repeatUtterance);
            }, 3000);
        } catch (error) {
            console.error("TTS error:", error);
        }
    };

    // ---------- Format Helpers ----------

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    if (!board) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <p className="text-white text-2xl">Memuat tampilan antrian...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Antrian Pasien</h1>
                    <p className="text-slate-400 text-sm">Sistem Informasi Manajemen Rumah Sakit</p>
                </div>

                {/* Department Filter */}
                <div className="flex items-center gap-4">
                    {departments.length > 1 && (
                        <select
                            value={selectedDepartment || ""}
                            onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined)}
                            className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm border border-slate-600"
                        >
                            <option value="">Semua</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    )}
                    <div className="text-right">
                        <p className="text-3xl font-mono font-bold tabular-nums">{formatTime(currentTime)}</p>
                        <p className="text-xs text-slate-400">{formatDate(currentTime)}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-3 gap-6">
                {/* Left: Now Serving */}
                <div className="col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Sedang Dilayani</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {board.now_serving.length === 0 ? (
                            <div className="col-span-2 flex items-center justify-center h-48 bg-slate-800/50 rounded-2xl border border-slate-700">
                                <p className="text-slate-500 text-xl">Belum ada panggilan</p>
                            </div>
                        ) : (
                            board.now_serving.map((item) => (
                                <NowServingCard
                                    key={item.id}
                                    item={item}
                                    isLatest={lastCalledItem?.id === item.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Next Up + Stats */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Antrian Berikutnya</h2>

                    {/* Waiting Count */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 text-center">
                        <p className="text-5xl font-bold text-blue-400">{board.waiting_count}</p>
                        <p className="text-sm text-slate-400 mt-1">Pasien Menunggu</p>
                    </div>

                    {/* Next Up List */}
                    <div className="space-y-2">
                        {board.next_up.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-xl border ${index === 0
                                    ? "bg-blue-900/30 border-blue-700"
                                    : "bg-slate-800/50 border-slate-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-mono font-bold">{item.queue_number}</span>
                                    <span className="text-sm text-slate-400">{item.department_name}</span>
                                </div>
                                {item.priority !== "normal" && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${item.priority === "emergency"
                                        ? "bg-red-900/50 text-red-300"
                                        : "bg-amber-900/50 text-amber-300"
                                        }`}>
                                        {item.priority === "emergency" ? "Darurat" : "Lansia"}
                                    </span>
                                )}
                            </div>
                        ))}
                        {board.next_up.length === 0 && (
                            <p className="text-center text-slate-500 py-4">Tidak ada antrian</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-600">
                SIMRS SIMTECH — Sistem Antrian Pasien
            </div>
        </div>
    );
};

// ---------- Sub Components ----------

function NowServingCard({ item, isLatest }: { item: QueueItem; isLatest: boolean }) {
    return (
        <div
            className={`relative p-6 rounded-2xl border-2 transition-all ${isLatest
                ? "bg-gradient-to-br from-medical-600/20 to-blue-600/20 border-medical-500 animate-pulse"
                : "bg-slate-800/50 border-slate-700"
                }`}
        >
            {isLatest && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            )}
            <p className="text-sm text-slate-400 mb-1">{item.counter_name || "Loket"}</p>
            <p className="text-5xl font-mono font-bold mb-2">{item.queue_number}</p>
            <p className="text-sm text-slate-300">{item.patient_name || "Pasien"}</p>
            <p className="text-xs text-slate-500 mt-1">{item.department_name}</p>
        </div>
    );
}

export default QueueDisplay;
