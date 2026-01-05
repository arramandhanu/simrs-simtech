import { useState } from "react";
import { z } from "zod";
import { Input } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import { Save, Loader2 } from "lucide-react";

// Validation schema for required fields
const doctorSchema = z.object({
  kode_dokter: z.string().min(1, "Kode Dokter is required"),
  nama: z.string().min(1, "Nama is required"),
});

export interface DoctorFormData {
  kode_dokter: string;
  nama: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jenis_kelamin?: "L" | "P";
  tanggal_lahir?: string;
  no_hp?: string;
  email?: string;
  alamat?: string;
  status?: string;
}

interface DoctorFormProps {
  onSubmit: (data: DoctorFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<DoctorFormData>;
  isLoading?: boolean;
}

export const DoctorForm = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: DoctorFormProps) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    kode_dokter: initialData?.kode_dokter ?? "",
    nama: initialData?.nama ?? "",
    gelar_depan: initialData?.gelar_depan ?? "",
    gelar_belakang: initialData?.gelar_belakang ?? "",
    jenis_kelamin: initialData?.jenis_kelamin ?? "L",
    tanggal_lahir: initialData?.tanggal_lahir?.split("T")[0] ?? "",
    no_hp: initialData?.no_hp ?? "",
    email: initialData?.email ?? "",
    alamat: initialData?.alamat ?? "",
    status: initialData?.status ?? "AKTIF",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = doctorSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  const FormSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </p>
          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <FormSection title="Basic Information *">
        <Input
          label="Kode Dokter"
          name="kode_dokter"
          value={formData.kode_dokter}
          onChange={handleChange}
          error={errors.kode_dokter}
          required
        />
        <Input
          label="Nama Lengkap"
          name="nama"
          value={formData.nama}
          onChange={handleChange}
          error={errors.nama}
          required
        />
        <Input
          label="Gelar Depan"
          name="gelar_depan"
          value={formData.gelar_depan}
          onChange={handleChange}
          placeholder="dr., Prof., etc."
        />
        <Input
          label="Gelar Belakang"
          name="gelar_belakang"
          value={formData.gelar_belakang}
          onChange={handleChange}
          placeholder="Sp.PD, M.Kes, etc."
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Jenis Kelamin
          </label>
          <select
            name="jenis_kelamin"
            value={formData.jenis_kelamin}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <Input
          label="Tanggal Lahir"
          name="tanggal_lahir"
          type="date"
          value={formData.tanggal_lahir}
          onChange={handleChange}
        />
      </FormSection>

      {/* Contact Information */}
      <FormSection title="Contact Information">
        <Input
          label="No. HP"
          name="no_hp"
          value={formData.no_hp}
          onChange={handleChange}
          placeholder="08xxxxxxxxxx"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Alamat
          </label>
          <textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none"
            placeholder="Alamat lengkap..."
          />
        </div>
      </FormSection>

      {/* Status */}
      <FormSection title="Status">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="AKTIF">Aktif</option>
            <option value="TIDAK AKTIF">Tidak Aktif</option>
          </select>
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          icon={
            isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )
          }
        >
          {isLoading ? "Saving..." : "Save Doctor"}
        </Button>
      </div>
    </form>
  );
};
