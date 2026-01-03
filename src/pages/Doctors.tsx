import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { DoctorTable } from "../features/doctors/components/DoctorTable";
import { doctorService } from "../services/doctorService";
import type { Doctor } from "../types/doctor";

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        <Button icon={<Plus size={20} />}>Add New Doctor</Button>
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
    </div>
  );
};

export default Doctors;
