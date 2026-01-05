import { useState, useMemo } from "react";
import {
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import type { Doctor } from "../../../types/doctor";
import { Button } from "../../../components/common/Button";

interface DoctorTableProps {
  doctors: Doctor[];
  isLoading?: boolean;
  onView?: (doctor: Doctor) => void;
  onEdit?: (doctor: Doctor) => void;
}

type SortKey = "kode_dokter" | "nama" | "email" | "no_hp" | "status";
type SortDirection = "asc" | "desc" | null;

export const DoctorTable = ({
  doctors,
  isLoading,
  onView,
  onEdit,
}: DoctorTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const itemsPerPage = 5;

  // Sorting Logic
  const sortedDoctors = useMemo(() => {
    if (!sortKey || !sortDirection) return doctors;

    return [...doctors].sort((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [doctors, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key)
      return <ChevronsUpDown size={14} className="text-slate-400" />;
    if (sortDirection === "asc")
      return <ChevronUp size={14} className="text-medical-600" />;
    if (sortDirection === "desc")
      return <ChevronDown size={14} className="text-medical-600" />;
    return <ChevronsUpDown size={14} className="text-slate-400" />;
  };

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

  const totalPages = Math.ceil(sortedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = sortedDoctors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const SortableHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <th
      className="py-4 px-4 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        {getSortIcon(sortKeyName)}
      </div>
    </th>
  );

  const formatGender = (gender?: string) => {
    if (gender === "L") return "Laki-laki";
    if (gender === "P") return "Perempuan";
    return "-";
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <SortableHeader label="Kode" sortKeyName="kode_dokter" />
              <SortableHeader label="Nama" sortKeyName="nama" />
              <SortableHeader label="Email" sortKeyName="email" />
              <SortableHeader label="No. HP" sortKeyName="no_hp" />
              <SortableHeader label="Status" sortKeyName="status" />
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
                  {doctor.kode_dokter}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    {doctor.gelar_depan} {doctor.nama}
                    {doctor.gelar_belakang ? `, ${doctor.gelar_belakang}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatGender(doctor.jenis_kelamin)}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {doctor.email || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {doctor.no_hp || "-"}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doctor.status === "AKTIF"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {doctor.status || "Unknown"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={16} />}
                      onClick={() => onView?.(doctor)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => onEdit?.(doctor)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, sortedDoctors.length)} of{" "}
            {sortedDoctors.length} results
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
