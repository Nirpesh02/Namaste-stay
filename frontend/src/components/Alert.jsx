import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

export default function Alert({ type = "info", title, message, dismissible = true, onDismiss = null }) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      title: "text-green-900",
      text: "text-green-800",
      button: "hover:bg-green-100",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      title: "text-red-900",
      text: "text-red-800",
      button: "hover:bg-red-100",
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      title: "text-yellow-900",
      text: "text-yellow-800",
      button: "hover:bg-yellow-100",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "text-blue-900",
      text: "text-blue-800",
      button: "hover:bg-blue-100",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 flex gap-4 items-start`}>
      <Icon size={20} className={config.title} />
      <div className="flex-1">
        {title && <h4 className={`font-semibold ${config.title}`}>{title}</h4>}
        <p className={`text-sm ${config.text} ${title ? "mt-1" : ""}`}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className={`text-gray-400 hover:text-gray-600 hover:scale-110 ${config.button} p-1 rounded transition-all`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
