import { useState } from "react";
import { z } from "zod";
import { Input } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import { Save, Loader2 } from "lucide-react";

// Validation schema for required fields
const doctorSchema = z.object({
  kode: z.string().min(1, "Kode is required"),
  nama: z.string().min(1, "Nama is required"),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]),
  practitioner_id: z.string().min(1, "Practitioner ID is required"),
});

export interface DoctorFormData {
  // Required
  kode: string;
  nama: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  practitioner_id: string;
  // Optional - Personal
  gelar?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  nik?: string;
  email?: string;
  no_telp?: string;
  alamat?: string;
  // Optional - Credentials
  no_str?: string;
  tgl_berlaku_str?: string;
  tgl_kadaluarsa_str?: string;
  no_sip?: string;
  tgl_berlaku_sip?: string;
  tgl_kadaluarsa_sip?: string;
  // Optional - Professional
  spesialisasi?: string;
  pendidikan?: string;
  poli?: string;
  // Optional - Employment
  status_pegawai?: "Tetap" | "Kontrak" | "Magang";
  jabatan?: string;
  shift?: string;
  nip?: string;
  tgl_mulai_kerja?: string;
  jabatan_struktural?: string;
  status_aktif?: "Aktif" | "Tidak Aktif";
  unit_kerja?: string;
  golongan?: string;
  gaji_pokok?: number;
  tunjangan?: number;
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
    kode: initialData?.kode ?? "",
    nama: initialData?.nama ?? "",
    jenis_kelamin: initialData?.jenis_kelamin ?? "Laki-laki",
    practitioner_id: initialData?.practitioner_id ?? "",
    gelar: initialData?.gelar ?? "",
    tempat_lahir: initialData?.tempat_lahir ?? "",
    tanggal_lahir: initialData?.tanggal_lahir ?? "",
    nik: initialData?.nik ?? "",
    email: initialData?.email ?? "",
    no_telp: initialData?.no_telp ?? "",
    alamat: initialData?.alamat ?? "",
    no_str: initialData?.no_str ?? "",
    no_sip: initialData?.no_sip ?? "",
    spesialisasi: initialData?.spesialisasi ?? "",
    pendidikan: initialData?.pendidikan ?? "",
    poli: initialData?.poli ?? "",
    status_pegawai: initialData?.status_pegawai ?? "Tetap",
    jabatan: initialData?.jabatan ?? "",
    status_aktif: initialData?.status_aktif ?? "Aktif",
    unit_kerja: initialData?.unit_kerja ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const result = doctorSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors({}); // Clear errors before submit
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

      {/* Required Information */}
      <FormSection title="Basic Information *">
        <Input
          label="Kode Dokter"
          name="kode"
          value={formData.kode}
          onChange={handleChange}
          error={errors.kode}
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Jenis Kelamin *
          </label>
          <select
            name="jenis_kelamin"
            value={formData.jenis_kelamin}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <Input
          label="Practitioner ID"
          name="practitioner_id"
          value={formData.practitioner_id}
          onChange={handleChange}
          error={errors.practitioner_id}
          required
        />
      </FormSection>

      {/* Personal Information */}
      <FormSection title="Personal Information">
        <Input
          label="Gelar"
          name="gelar"
          value={formData.gelar}
          onChange={handleChange}
          placeholder="dr., Sp.PD, etc."
          required
        />
        <Input
          label="NIK"
          name="nik"
          value={formData.nik}
          onChange={handleChange}
          required
        />
        <Input
          label="Tempat Lahir"
          name="tempat_lahir"
          value={formData.tempat_lahir}
          onChange={handleChange}
          required
        />
        <Input
          label="Tanggal Lahir"
          name="tanggal_lahir"
          type="date"
          value={formData.tanggal_lahir}
          onChange={handleChange}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          label="No. Telepon"
          name="no_telp"
          value={formData.no_telp}
          onChange={handleChange}
          required
        />
      </FormSection>

      {/* Credentials */}
      <FormSection title="Credentials">
        <Input
          label="No. STR"
          name="no_str"
          value={formData.no_str}
          onChange={handleChange}
          required
        />
        <Input
          label="No. SIP"
          name="no_sip"
          value={formData.no_sip}
          onChange={handleChange}
          required
        />
        <Input
          label="Spesialisasi"
          name="spesialisasi"
          value={formData.spesialisasi}
          onChange={handleChange}
          placeholder="Umum, Bedah, Anak, etc."
          required
        />
        <Input
          label="Pendidikan"
          name="pendidikan"
          value={formData.pendidikan}
          onChange={handleChange}
          required
        />
      </FormSection>

      {/* Employment */}
      <FormSection title="Employment">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status Pegawai
          </label>
          <select
            name="status_pegawai"
            value={formData.status_pegawai}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="Tetap">Tetap</option>
            <option value="Kontrak">Kontrak</option>
            <option value="Magang">Magang</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status Aktif
          </label>
          <select
            name="status_aktif"
            value={formData.status_aktif}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
        <Input
          label="Poli"
          name="poli"
          value={formData.poli}
          onChange={handleChange}
          required
        />
        <Input
          label="Jabatan"
          name="jabatan"
          value={formData.jabatan}
          onChange={handleChange}
          required
        />
        <Input
          label="Unit Kerja"
          name="unit_kerja"
          value={formData.unit_kerja}
          onChange={handleChange}
          required
        />
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
