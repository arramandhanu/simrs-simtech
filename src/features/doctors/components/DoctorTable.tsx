import { useState } from "react";
import { Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import type { Doctor } from "../../../types/doctor";
import { Button } from "../../../components/common/Button";

interface DoctorTableProps {
  doctors: Doctor[];
  isLoading?: boolean;
}

export const DoctorTable = ({ doctors, isLoading }: DoctorTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (isLoading) {
    return (
      <div className="text-center p-8 text-slate-500">Loading doctors...</div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">No doctors found.</div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(doctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = doctors.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-4 px-4 text-sm font-semibold text-slate-600">
                Kode
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-slate-600">
                Nama
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-slate-600">
                SIP
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-slate-600">
                Spesialisasi
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-slate-600">
                Status
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-slate-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedDoctors.map((doctor) => (
              <tr
                key={doctor.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                  {doctor.kode}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    {doctor.nama}
                  </div>
                  <div className="text-xs text-slate-500">{doctor.email}</div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {doctor.no_sip || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {doctor.spesialisasi || "-"}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doctor.status_aktif === "Aktif"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {doctor.status_aktif || "Unknown"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={16} />}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit size={16} />}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      icon={<Trash2 size={16} />}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, doctors.length)} of{" "}
            {doctors.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              icon={<ChevronLeft size={16} />}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-medical-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
};
