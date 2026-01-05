import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { Toast, useToast } from "../components/common/Toast";
import { DoctorTable } from "../features/doctors/components/DoctorTable";
import {
  DoctorForm,
  type DoctorFormData,
} from "../features/doctors/components/DoctorForm";
import { DoctorDetail } from "../features/doctors/components/DoctorDetail";
import { doctorService } from "../services/doctorService";
import type { Doctor } from "../types/doctor";

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
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
        setIsModalOpen(false);
        showToast("Doctor created successfully!", "success");
        fetchDoctors(); // Refresh the list
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

  const handleEditDoctor = async (data: DoctorFormData) => {
    if (!editingDoctor) return;
    setIsSubmitting(true);
    try {
      const response = await doctorService.updateDoctor(editingDoctor.id, data);
      if (response.success) {
        setEditingDoctor(null);
        showToast("Doctor updated successfully!", "success");
        fetchDoctors();
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

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.kode.toLowerCase().includes(searchTerm.toLowerCase())
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
              Manage doctor data, schedules, and assignments
            </p>
          </div>
          <Button
            icon={<Plus size={20} />}
            onClick={() => setIsModalOpen(true)}
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
            onView={(doctor) => setSelectedDoctor(doctor)}
            onEdit={(doctor) => setEditingDoctor(doctor)}
          />
        </Card>

        {/* Add Doctor Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Doctor"
          size="xl"
        >
          <DoctorForm
            onSubmit={handleCreateDoctor}
            onCancel={() => setIsModalOpen(false)}
            isLoading={isSubmitting}
          />
        </Modal>

        {/* View Doctor Modal */}
        <Modal
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title="Doctor Information"
          size="xl"
        >
          {selectedDoctor && <DoctorDetail doctor={selectedDoctor} />}
        </Modal>

        {/* Edit Doctor Modal */}
        <Modal
          isOpen={!!editingDoctor}
          onClose={() => setEditingDoctor(null)}
          title="Edit Doctor"
          size="xl"
        >
          {editingDoctor && (
            <DoctorForm
              onSubmit={handleEditDoctor}
              onCancel={() => setEditingDoctor(null)}
              initialData={editingDoctor}
              isLoading={isSubmitting}
            />
          )}
        </Modal>
      </div>
    </>
  );
};

export default Doctors;
