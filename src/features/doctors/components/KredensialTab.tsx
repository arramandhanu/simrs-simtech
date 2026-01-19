import { useState, useEffect, useRef } from "react";
import {
  Save,
  Loader2,
  Upload,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { Input } from "../../../components/common/Input";
import { kredensialService } from "../../../services/kredensialService";
import {
  getKredensialStatus,
  type KredensialSTR,
  type KredensialSIP,
  type KredensialStatus,
} from "../../../types/kredensial";

interface KredensialTabProps {
  dokterId: string;
  onSuccess?: () => void;
}

export const KredensialTab = ({ dokterId, onSuccess }: KredensialTabProps) => {
  // STR State
  const [strData, setStrData] = useState<KredensialSTR | null>(null);
  const [nomorStr, setNomorStr] = useState("");
  const [berlakuSampaiStr, setBerlakuSampaiStr] = useState("");
  const [selectedFileStr, setSelectedFileStr] = useState<File | null>(null);
  const [loadingStr, setLoadingStr] = useState(true);
  const [savingStr, setSavingStr] = useState(false);
  const [errorsStr, setErrorsStr] = useState<Record<string, string>>({});
  const fileInputRefStr = useRef<HTMLInputElement>(null);

  // SIP State
  const [sipList, setSipList] = useState<KredensialSIP[]>([]);
  const [showSipForm, setShowSipForm] = useState(false);
  const [editingSip, setEditingSip] = useState<KredensialSIP | null>(null);
  const [nomorSip, setNomorSip] = useState("");
  const [poliSip, setPoliSip] = useState("");
  const [berlakuSampaiSip, setBerlakuSampaiSip] = useState("");
  const [selectedFileSip, setSelectedFileSip] = useState<File | null>(null);
  const [savingSip, setSavingSip] = useState(false);
  const [errorsSip, setErrorsSip] = useState<Record<string, string>>({});
  const fileInputRefSip = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSTR();
  }, [dokterId]);

  const fetchSTR = async () => {
    setLoadingStr(true);
    try {
      const response = await kredensialService.getSTR(dokterId);
      if (response.success && response.data) {
        setStrData(response.data);
        setNomorStr(response.data.nomor_str);
        setBerlakuSampaiStr(response.data.berlaku_sampai?.split("T")[0] || "");
      }
    } catch (err) {
      console.error("Error fetching STR:", err);
    } finally {
      setLoadingStr(false);
    }
  };

  // STR Functions
  const validateStr = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nomorStr.trim()) {
      newErrors.nomor_str = "Nomor STR harus diisi";
    }

    if (!berlakuSampaiStr) {
      newErrors.berlaku_sampai = "Tanggal berlaku harus diisi";
    } else {
      const expiryDate = new Date(berlakuSampaiStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        newErrors.berlaku_sampai = "Tanggal berlaku harus lebih dari hari ini";
      }
    }

    if (!strData && !selectedFileStr) {
      newErrors.file = "File STR harus diupload";
    }

    setErrorsStr(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStr = async () => {
    if (!validateStr()) return;

    setSavingStr(true);
    try {
      if (!selectedFileStr && !strData) {
        setErrorsStr({ file: "File STR harus diupload" });
        setSavingStr(false);
        return;
      }

      if (!selectedFileStr) {
        setErrorsStr({ file: "Pilih file baru untuk mengupdate STR" });
        setSavingStr(false);
        return;
      }

      const response = await kredensialService.uploadSTR(dokterId, {
        nomor_str: nomorStr,
        berlaku_sampai: berlakuSampaiStr,
        file: selectedFileStr,
      });

      if (response.success) {
        setStrData(response.data);
        setSelectedFileStr(null);
        if (fileInputRefStr.current) fileInputRefStr.current.value = "";
        onSuccess?.();
      } else {
        setErrorsStr({ submit: response.message || "Gagal menyimpan STR" });
      }
    } catch (err) {
      console.error("Error saving STR:", err);
      setErrorsStr({ submit: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSavingStr(false);
    }
  };

  const handleFileChangeStr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrorsStr({ file: "Format file harus PDF, JPG, atau PNG" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorsStr({ file: "Ukuran file maksimal 5MB" });
        return;
      }
      setSelectedFileStr(file);
      setErrorsStr((prev) => ({ ...prev, file: "" }));
    }
  };

  // SIP Functions
  const validateSip = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nomorSip.trim()) {
      newErrors.nomor_sip = "Nomor SIP harus diisi";
    }

    if (!poliSip.trim()) {
      newErrors.poli = "Poli/Unit harus diisi";
    }

    if (!berlakuSampaiSip) {
      newErrors.berlaku_sampai = "Tanggal berlaku harus diisi";
    } else {
      const expiryDate = new Date(berlakuSampaiSip);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        newErrors.berlaku_sampai = "Tanggal berlaku harus lebih dari hari ini";
      }
    }

    if (!editingSip && !selectedFileSip) {
      newErrors.file = "File SIP harus diupload";
    }

    setErrorsSip(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitSip = async () => {
    if (!validateSip()) return;

    setSavingSip(true);
    try {
      // For now, just manage locally (frontend only)
      const newSip: KredensialSIP = {
        id: editingSip?.id || `temp-${Date.now()}`,
        dokter_id: dokterId,
        nomor_sip: nomorSip,
        poli: poliSip,
        berlaku_sampai: berlakuSampaiSip,
        file_name: selectedFileSip?.name || editingSip?.file_name,
        file_path: editingSip?.file_path,
      };

      if (editingSip) {
        // Update existing
        setSipList((prev) =>
          prev.map((s) => (s.id === editingSip.id ? newSip : s))
        );
      } else {
        // Add new
        setSipList((prev) => [...prev, newSip]);
      }

      // Reset form
      resetSipForm();
      onSuccess?.();
    } catch (err) {
      console.error("Error saving SIP:", err);
      setErrorsSip({ submit: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSavingSip(false);
    }
  };

  const handleEditSip = (sip: KredensialSIP) => {
    setEditingSip(sip);
    setNomorSip(sip.nomor_sip);
    setPoliSip(sip.poli);
    setBerlakuSampaiSip(sip.berlaku_sampai?.split("T")[0] || "");
    setShowSipForm(true);
    setSelectedFileSip(null);
  };

  const handleDeleteSip = (sipId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus SIP ini?")) {
      setSipList((prev) => prev.filter((s) => s.id !== sipId));
    }
  };

  const resetSipForm = () => {
    setShowSipForm(false);
    setEditingSip(null);
    setNomorSip("");
    setPoliSip("");
    setBerlakuSampaiSip("");
    setSelectedFileSip(null);
    setErrorsSip({});
    if (fileInputRefSip.current) fileInputRefSip.current.value = "";
  };

  const handleFileChangeSip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrorsSip({ file: "Format file harus PDF, JPG, atau PNG" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorsSip({ file: "Ukuran file maksimal 5MB" });
        return;
      }
      setSelectedFileSip(file);
      setErrorsSip((prev) => ({ ...prev, file: "" }));
    }
  };

  // Status Badge
  const getStatusBadge = (status: KredensialStatus) => {
    switch (status) {
      case "valid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
            <CheckCircle size={12} /> Valid
          </span>
        );
      case "hampir_habis":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={12} /> Hampir Habis
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
            <XCircle size={12} /> Expired
          </span>
        );
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loadingStr) {
    return (
      <Card>
        <div className="p-8 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading kredensial data...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==================== STR SECTION ==================== */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Surat Tanda Registrasi (STR)
          </h3>

          {/* STR Preview */}
          {strData && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Preview STR
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Nama File
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Tanggal Berlaku
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-800">
                            {strData.file_name || "STR Document"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(strData.berlaku_sampai)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(
                          getKredensialStatus(strData.berlaku_sampai)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {strData.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={16} />}
                            onClick={() =>
                              window.open(
                                kredensialService.getFileUrl(
                                  strData.file_path!
                                ),
                                "_blank"
                              )
                            }
                          >
                            Lihat
                          </Button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STR Form */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">
              {strData ? "Update STR" : "Upload STR"}
            </h4>

            {errorsStr.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {errorsStr.submit}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nomor STR *"
                name="nomor_str"
                value={nomorStr}
                onChange={(e) => setNomorStr(e.target.value)}
                error={errorsStr.nomor_str}
                placeholder="Masukkan nomor STR"
              />
              <Input
                label="Berlaku Sampai *"
                name="berlaku_sampai_str"
                type="date"
                value={berlakuSampaiStr}
                onChange={(e) => setBerlakuSampaiStr(e.target.value)}
                error={errorsStr.berlaku_sampai}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload File STR * (PDF/JPG/PNG, max 5MB)
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRefStr}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChangeStr}
                  className="hidden"
                  id="str-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  icon={<Upload size={16} />}
                  onClick={() => fileInputRefStr.current?.click()}
                >
                  Pilih File
                </Button>
                {selectedFileStr && (
                  <span className="text-sm text-slate-600">
                    {selectedFileStr.name}
                  </span>
                )}
              </div>
              {errorsStr.file && (
                <p className="mt-1 text-xs text-red-500">{errorsStr.file}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitStr}
                disabled={savingStr}
                icon={
                  savingStr ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )
                }
              >
                {savingStr ? "Menyimpan..." : "Simpan STR"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== SIP SECTION ==================== */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Surat Izin Praktik (SIP)
            </h3>
            {!showSipForm && (
              <Button
                icon={<Plus size={16} />}
                onClick={() => setShowSipForm(true)}
              >
                Tambah SIP
              </Button>
            )}
          </div>

          {/* SIP Table */}
          {sipList.length > 0 && (
            <div className="mb-6">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Nomor SIP
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Poli
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Berlaku Sampai
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sipList.map((sip) => (
                      <tr key={sip.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {sip.nomor_sip}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {sip.poli}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(sip.berlaku_sampai)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(
                            getKredensialStatus(sip.berlaku_sampai)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit size={16} />}
                              onClick={() => handleEditSip(sip)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              icon={<Trash2 size={16} />}
                              onClick={() => handleDeleteSip(sip.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sipList.length === 0 && !showSipForm && (
            <div className="text-center py-8 text-slate-500">
              Belum ada data SIP. Klik "Tambah SIP" untuk menambahkan.
            </div>
          )}

          {/* SIP Form */}
          {showSipForm && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-700">
                {editingSip ? "Edit SIP" : "Tambah SIP Baru"}
              </h4>

              {errorsSip.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {errorsSip.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nomor SIP *"
                  name="nomor_sip"
                  value={nomorSip}
                  onChange={(e) => setNomorSip(e.target.value)}
                  error={errorsSip.nomor_sip}
                  placeholder="Masukkan nomor SIP"
                />
                <Input
                  label="Poli/Unit *"
                  name="poli"
                  value={poliSip}
                  onChange={(e) => setPoliSip(e.target.value)}
                  error={errorsSip.poli}
                  placeholder="Contoh: Poli Umum, IGD, dll"
                />
                <Input
                  label="Berlaku Sampai *"
                  name="berlaku_sampai_sip"
                  type="date"
                  value={berlakuSampaiSip}
                  onChange={(e) => setBerlakuSampaiSip(e.target.value)}
                  error={errorsSip.berlaku_sampai}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload File SIP * (PDF/JPG/PNG)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRefSip}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChangeSip}
                      className="hidden"
                      id="sip-file-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Upload size={14} />}
                      onClick={() => fileInputRefSip.current?.click()}
                    >
                      Pilih File
                    </Button>
                    {(selectedFileSip || editingSip?.file_name) && (
                      <span className="text-sm text-slate-600 truncate">
                        {selectedFileSip?.name || editingSip?.file_name}
                      </span>
                    )}
                  </div>
                  {errorsSip.file && (
                    <p className="mt-1 text-xs text-red-500">
                      {errorsSip.file}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetSipForm}>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitSip}
                  disabled={savingSip}
                  icon={
                    savingSip ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )
                  }
                >
                  {savingSip
                    ? "Menyimpan..."
                    : editingSip
                    ? "Update SIP"
                    : "Simpan SIP"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
