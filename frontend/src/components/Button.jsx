export default function Button({ text, onClick, variant = "primary", size = "md", disabled = false, icon: Icon = null }) {
  const baseStyles = "font-semibold rounded-full transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95";

  const variants = {
    primary: "bg-red-700 text-white hover:bg-red-800",
    secondary: "bg-white border border-red-700 text-red-700 hover:bg-red-50",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles}`}
    >
      {Icon && <Icon size={18} />}
      {text}
    </button>
  );
}