import {
  User,
  Award,
  FileCheck,
  Building,
  Calendar,
  RefreshCw,
  Edit,
  Eye,
} from "lucide-react";
import { Modal } from "../../../components/common/Modal";
import { Tabs } from "../../../components/common/Tabs";
import { Button } from "../../../components/common/Button";
import { DoctorDetail } from "./DoctorDetail";
import { DoctorForm, type DoctorFormData } from "./DoctorForm";
import { PlaceholderTab } from "./PlaceholderTab";
import { SpesialisasiTab } from "./SpesialisasiTab";
import type { Doctor } from "../../../types/doctor";

const DOCTOR_TABS = [
  { id: "identitas", label: "Identitas", icon: <User size={16} /> },
  { id: "spesialisasi", label: "Spesialisasi", icon: <Award size={16} /> },
  { id: "kredensial", label: "Kredensial", icon: <FileCheck size={16} /> },
  { id: "penugasan", label: "Penugasan Poli", icon: <Building size={16} /> },
  { id: "jadwal", label: "Jadwal Praktik", icon: <Calendar size={16} /> },
  { id: "status", label: "Status", icon: <RefreshCw size={16} /> },
];

interface DoctorModalProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
  onUpdate: (data: DoctorFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const DoctorModal = ({
  doctor,
  isOpen,
  onClose,
  mode,
  onModeChange,
  onUpdate,
  isSubmitting = false,
}: DoctorModalProps) => {
  const fullName = `${doctor.gelar_depan || ""} ${doctor.nama}${
    doctor.gelar_belakang ? `, ${doctor.gelar_belakang}` : ""
  }`.trim();

  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case "identitas":
        return mode === "view" ? (
          <DoctorDetail doctor={doctor} />
        ) : (
          <DoctorForm
            onSubmit={onUpdate}
            onCancel={() => onModeChange("view")}
            initialData={doctor}
            isLoading={isSubmitting}
          />
        );
      case "spesialisasi":
        return <SpesialisasiTab dokterId={doctor.id} />;
      case "kredensial":
        return (
          <PlaceholderTab
            title="Kredensial STR & SIP"
            description="Manage STR and SIP credentials with expiry tracking."
          />
        );
      case "penugasan":
        return (
          <PlaceholderTab
            title="Penugasan Poli"
            description="Manage polyclinic assignments for this doctor."
          />
        );
      case "jadwal":
        return (
          <PlaceholderTab
            title="Jadwal Praktik"
            description="Create and manage practice schedules for this doctor."
          />
        );
      case "status":
        return (
          <PlaceholderTab
            title="Perubahan Status"
            description="Track status changes and employment history."
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="full">
      <div className="space-y-4">
        {/* Header with Doctor Info and Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-medical-100 flex items-center justify-center">
              <User size={28} className="text-medical-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
              <p className="text-slate-500">{doctor.kode_dokter}</p>
            </div>
            <span
              className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.status === "AKTIF"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {doctor.status || "Unknown"}
            </span>
          </div>
          <div className="flex gap-2">
            {mode === "view" ? (
              <Button
                variant="outline"
                icon={<Edit size={16} />}
                onClick={() => onModeChange("edit")}
              >
                Edit
              </Button>
            ) : (
              <Button
                variant="outline"
                icon={<Eye size={16} />}
                onClick={() => onModeChange("view")}
              >
                View
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={DOCTOR_TABS} defaultTab="identitas">
          {renderTabContent}
        </Tabs>
      </div>
    </Modal>
  );
};
