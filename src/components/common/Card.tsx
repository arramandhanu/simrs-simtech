import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  action,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          {title && (
            <h2 className="font-bold text-lg text-slate-800">{title}</h2>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title ? "" : "p-6"}>{children}</div>
    </div>
  );
};
