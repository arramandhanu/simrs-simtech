import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { spesialisService } from "../../../services/spesialisService";
import type { Spesialis, DokterSpesialis } from "../../../types/spesialis";

interface SpesialisasiTabProps {
  dokterId: string;
  onSuccess?: () => void;
}

export const SpesialisasiTab = ({
  dokterId,
  onSuccess,
}: SpesialisasiTabProps) => {
  const [spesialisList, setSpesialisList] = useState<Spesialis[]>([]);
  const [dokterSpesialis, setDokterSpesialis] = useState<DokterSpesialis[]>([]);
  const [spesialisUtamaId, setSpesialisUtamaId] = useState<string>("");
  const [spesialisTambahanId, setSpesialisTambahanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dokterId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all specializations for dropdown
      const spesialisResponse = await spesialisService.getAllSpesialis();
      if (spesialisResponse.success) {
        setSpesialisList(spesialisResponse.data);
      }

      // Fetch doctor's current specializations
      const dokterSpesialisResponse = await spesialisService.getDokterSpesialis(
        dokterId
      );
      if (dokterSpesialisResponse.success) {
        setDokterSpesialis(dokterSpesialisResponse.data);

        // Set current values
        const utama = dokterSpesialisResponse.data.find((ds) => ds.is_utama);
        const tambahan = dokterSpesialisResponse.data.find(
          (ds) => !ds.is_utama
        );

        if (utama) setSpesialisUtamaId(utama.spesialis_id);
        if (tambahan) setSpesialisTambahanId(tambahan.spesialis_id);
      }
    } catch (err) {
      console.error("Error fetching spesialis data:", err);
      setError("Failed to load specialization data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await spesialisService.updateDokterSpesialis(dokterId, {
        spesialis_utama_id: spesialisUtamaId || undefined,
        spesialis_tambahan_id: spesialisTambahanId || undefined,
      });

      if (response.success) {
        setDokterSpesialis(response.data);
        onSuccess?.();
      } else {
        setError(response.message || "Failed to save");
      }
    } catch (err) {
      console.error("Error saving spesialis:", err);
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  // Validation
  const isUtamaEmpty = !spesialisUtamaId;
  const isDuplicate =
    spesialisTambahanId && spesialisTambahanId === spesialisUtamaId;
  const isValid = !isUtamaEmpty && !isDuplicate;

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading specialization data...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Spesialisasi Utama */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Spesialisasi Utama
          </label>
          <select
            value={spesialisUtamaId}
            onChange={(e) => setSpesialisUtamaId(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="">-- Pilih Spesialisasi Utama --</option>
            {spesialisList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kode})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Primary specialization for this doctor
          </p>
        </div>

        {/* Spesialisasi Tambahan */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Spesialisasi Tambahan
          </label>
          <select
            value={spesialisTambahanId}
            onChange={(e) => setSpesialisTambahanId(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="">-- Pilih Spesialisasi Tambahan --</option>
            {spesialisList
              .filter((s) => s.id !== spesialisUtamaId) // Exclude primary
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kode})
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Additional/secondary specialization (optional)
          </p>
        </div>

        {/* Current Assignments Display */}
        {dokterSpesialis.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Current Assignments
            </h4>
            <div className="flex flex-wrap gap-2">
              {dokterSpesialis.map((ds) => (
                <span
                  key={ds.spesialis_id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    ds.is_utama
                      ? "bg-medical-100 text-medical-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {ds.spesialis?.nama || ds.spesialis_id}
                  {ds.is_utama && (
                    <span className="ml-2 text-xs bg-medical-600 text-white px-1.5 py-0.5 rounded">
                      Utama
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {isUtamaEmpty && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-amber-700">
              Spesialisasi Utama harus dipilih
            </span>
          </div>
        )}
        {isDuplicate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-amber-700">
              Spesialisasi Tambahan tidak boleh sama dengan Spesialisasi Utama
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            icon={
              saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )
            }
          >
            {saving ? "Saving..." : "Save Spesialisasi"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
