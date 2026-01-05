import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { DoctorTable } from "../features/doctors/components/DoctorTable";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        fetchDoctors(); // Refresh the list
      } else {
        alert(response.message || "Failed to create doctor");
      }
    } catch (error) {
      console.error("Failed to create doctor", error);
      alert("An error occurred while creating the doctor");
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
        <Button icon={<Plus size={20} />} onClick={() => setIsModalOpen(true)}>
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
        <DoctorTable doctors={filteredDoctors} isLoading={loading} />
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
    </div>
  );
};

export default Doctors;
