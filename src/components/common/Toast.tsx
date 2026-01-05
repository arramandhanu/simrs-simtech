import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const iconMap = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  warning: <AlertCircle size={20} className="text-amber-500" />,
  info: <Info size={20} className="text-blue-500" />,
};

const bgMap = {
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-blue-50 border-blue-200",
};

const textMap = {
  success: "text-green-800",
  error: "text-red-800",
  warning: "text-amber-800",
  info: "text-blue-800",
};

export const Toast = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      } ${bgMap[type]}`}
    >
      {iconMap[type]}
      <p className={`text-sm font-medium ${textMap[type]}`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-slate-400 hover:text-slate-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
};
