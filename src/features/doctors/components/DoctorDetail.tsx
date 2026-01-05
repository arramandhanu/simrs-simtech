import type { Doctor } from "../../../types/doctor";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  Building,
  Award,
} from "lucide-react";

interface DoctorDetailProps {
  doctor: Doctor;
}

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex items-start gap-3">
    <div className="text-slate-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  </div>
);

const Section = ({
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

// Format date from ISO string to dd/mm/yyyy
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export const DoctorDetail = ({ doctor }: DoctorDetailProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
        <div className="w-16 h-16 rounded-full bg-medical-100 flex items-center justify-center">
          <User size={32} className="text-medical-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {doctor.gelar} {doctor.nama}
          </h2>
          <p className="text-slate-500">{doctor.spesialisasi || "General"}</p>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
              doctor.status_aktif === "Aktif"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {doctor.status_aktif || "Unknown"}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <Section title="Basic Information">
        <InfoItem
          icon={<FileText size={16} />}
          label="Kode Dokter"
          value={doctor.kode}
        />
        <InfoItem
          icon={<FileText size={16} />}
          label="Practitioner ID"
          value={doctor.practitioner_id}
        />
        <InfoItem
          icon={<User size={16} />}
          label="Jenis Kelamin"
          value={doctor.jenis_kelamin}
        />
        <InfoItem
          icon={<FileText size={16} />}
          label="NIK"
          value={doctor.nik}
        />
      </Section>

      {/* Contact Information */}
      <Section title="Contact Information">
        <InfoItem
          icon={<Mail size={16} />}
          label="Email"
          value={doctor.email}
        />
        <InfoItem
          icon={<Phone size={16} />}
          label="No. Telepon"
          value={doctor.no_telp}
        />
        <InfoItem
          icon={<MapPin size={16} />}
          label="Tempat Lahir"
          value={doctor.tempat_lahir}
        />
        <InfoItem
          icon={<Calendar size={16} />}
          label="Tanggal Lahir"
          value={formatDate(doctor.tanggal_lahir)}
        />
      </Section>

      {/* Credentials */}
      <Section title="Credentials">
        <InfoItem
          icon={<Award size={16} />}
          label="No. STR"
          value={doctor.no_str}
        />
        <InfoItem
          icon={<Award size={16} />}
          label="No. SIP"
          value={doctor.no_sip}
        />
        <InfoItem
          icon={<Award size={16} />}
          label="Spesialisasi"
          value={doctor.spesialisasi}
        />
        <InfoItem
          icon={<Award size={16} />}
          label="Pendidikan"
          value={doctor.pendidikan}
        />
      </Section>

      {/* Employment */}
      <Section title="Employment">
        <InfoItem
          icon={<Briefcase size={16} />}
          label="Status Pegawai"
          value={doctor.status_pegawai}
        />
        <InfoItem
          icon={<Building size={16} />}
          label="Poli"
          value={doctor.poli}
        />
        <InfoItem
          icon={<Briefcase size={16} />}
          label="Jabatan"
          value={doctor.jabatan}
        />
        <InfoItem
          icon={<Building size={16} />}
          label="Unit Kerja"
          value={doctor.unit_kerja}
        />
      </Section>
    </div>
  );
};
