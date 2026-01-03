import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Card } from "../../../components/common/Card";
import type { Patient } from "../../../types/patient";

interface PatientTableProps {
  patients: Patient[];
}

export const PatientTable: React.FC<PatientTableProps> = ({ patients }) => {
  return (
    <Card
      className="overflow-hidden"
      title="Recent Registrations"
      action={
        <button className="text-sm text-medical-600 hover:text-medical-700 font-medium">
          View All
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {patient.name}
                </td>
                <td className="px-6 py-4 text-slate-500">{patient.mrn}</td>
                <td className="px-6 py-4 text-slate-600">
                  {patient.department}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.status === "Admitted"
                        ? "bg-green-100 text-green-700"
                        : patient.status === "Waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
