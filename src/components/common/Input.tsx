import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-500 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full py-3 border rounded-xl outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400
            ${icon ? "pl-10 pr-4" : "px-4"}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-200"
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
