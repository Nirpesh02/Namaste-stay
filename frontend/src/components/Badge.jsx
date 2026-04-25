import { X } from "lucide-react";

export default function Badge({ label, variant = "primary", removable = false, onRemove = null, icon: Icon = null }) {
  const variants = {
    primary: "bg-red-100 text-red-700 border border-red-200",
    secondary: "bg-blue-100 text-blue-700 border border-blue-200",
    success: "bg-green-100 text-green-700 border border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold hover:scale-105 transition-transform ${variants[variant]}`}>
      {Icon && <Icon size={14} />}
      {label}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-75 hover:scale-110 transition-all"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
