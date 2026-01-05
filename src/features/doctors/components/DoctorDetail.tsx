import type { Doctor } from "../../../types/doctor";
import { User, Mail, Phone, Calendar, FileText, MapPin } from "lucide-react";

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

const formatGender = (gender?: string) => {
  if (gender === "L") return "Laki-laki";
  if (gender === "P") return "Perempuan";
  return "-";
};

export const DoctorDetail = ({ doctor }: DoctorDetailProps) => {
  const fullName = `${doctor.gelar_depan || ""} ${doctor.nama}${
    doctor.gelar_belakang ? `, ${doctor.gelar_belakang}` : ""
  }`.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
        <div className="w-16 h-16 rounded-full bg-medical-100 flex items-center justify-center">
          <User size={32} className="text-medical-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
          <p className="text-slate-500">{doctor.kode_dokter}</p>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
              doctor.status === "AKTIF"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {doctor.status || "Unknown"}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <Section title="Basic Information">
        <InfoItem
          icon={<FileText size={16} />}
          label="Kode Dokter"
          value={doctor.kode_dokter}
        />
        <InfoItem icon={<User size={16} />} label="Nama" value={doctor.nama} />
        <InfoItem
          icon={<FileText size={16} />}
          label="Gelar Depan"
          value={doctor.gelar_depan}
        />
        <InfoItem
          icon={<FileText size={16} />}
          label="Gelar Belakang"
          value={doctor.gelar_belakang}
        />
        <InfoItem
          icon={<User size={16} />}
          label="Jenis Kelamin"
          value={formatGender(doctor.jenis_kelamin)}
        />
        <InfoItem
          icon={<Calendar size={16} />}
          label="Tanggal Lahir"
          value={formatDate(doctor.tanggal_lahir)}
        />
      </Section>

      {/* Contact Information */}
      <Section title="Contact Information">
        <InfoItem
          icon={<Phone size={16} />}
          label="No. HP"
          value={doctor.no_hp}
        />
        <InfoItem
          icon={<Mail size={16} />}
          label="Email"
          value={doctor.email}
        />
        <div className="md:col-span-2">
          <InfoItem
            icon={<MapPin size={16} />}
            label="Alamat"
            value={doctor.alamat}
          />
        </div>
      </Section>
    </div>
  );
};
