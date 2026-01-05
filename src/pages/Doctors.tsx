import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { Toast, useToast } from "../components/common/Toast";
import { DoctorTable } from "../features/doctors/components/DoctorTable";
import { DoctorModal } from "../features/doctors/components/DoctorModal";
import {
  DoctorForm,
  type DoctorFormData,
} from "../features/doctors/components/DoctorForm";
import { doctorService } from "../services/doctorService";
import type { Doctor } from "../types/doctor";

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getAllDoctors();
      if (response.success) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const response = await doctorService.createDoctor(data);
      if (response.success) {
        setIsAddModalOpen(false);
        showToast("Doctor created successfully!", "success");
        fetchDoctors();
      } else {
        showToast(response.message || "Failed to create doctor", "error");
      }
    } catch (error) {
      console.error("Failed to create doctor", error);
      showToast("An error occurred while creating the doctor", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDoctor = async (data: DoctorFormData) => {
    if (!selectedDoctor) return;
    setIsSubmitting(true);
    try {
      const response = await doctorService.updateDoctor(
        selectedDoctor.id,
        data
      );
      if (response.success) {
        showToast("Doctor updated successfully!", "success");
        fetchDoctors();
        // Refresh selected doctor data
        const updatedResponse = await doctorService.getDoctor(
          selectedDoctor.id
        );
        if (updatedResponse.success) {
          setSelectedDoctor(updatedResponse.data);
        }
      } else {
        showToast(response.message || "Failed to update doctor", "error");
      }
    } catch (error) {
      console.error("Failed to update doctor", error);
      showToast("An error occurred while updating the doctor", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setModalMode("view");
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setModalMode("edit");
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.kode_dokter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Doctor Management
            </h1>
            <p className="text-slate-500">
              Manage doctor data, credentials, schedules, and assignments
            </p>
          </div>
          <Button
            icon={<Plus size={20} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Doctor
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b border-slate-200">
            <div className="max-w-md">
              <Input
                placeholder="Search by name or code..."
                icon={<Search size={20} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <DoctorTable
            doctors={filteredDoctors}
            isLoading={loading}
            onView={handleViewDoctor}
            onEdit={handleEditDoctor}
          />
        </Card>

        {/* Add Doctor Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Doctor"
          size="xl"
        >
          <DoctorForm
            onSubmit={handleCreateDoctor}
            onCancel={() => setIsAddModalOpen(false)}
            isLoading={isSubmitting}
          />
        </Modal>

        {/* Doctor Detail/Edit Modal with Tabs */}
        {selectedDoctor && (
          <DoctorModal
            doctor={selectedDoctor}
            isOpen={!!selectedDoctor}
            onClose={handleCloseModal}
            mode={modalMode}
            onModeChange={setModalMode}
            onUpdate={handleUpdateDoctor}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  );
};

export default Doctors;
