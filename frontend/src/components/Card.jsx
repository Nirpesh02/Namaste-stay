export default function Card({ title, subtitle, children, onClick, variant = "default", icon: Icon = null }) {
  const variants = {
    default: "bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1",
    elevated: "bg-white rounded-2xl shadow-2xl border border-gray-100",
    minimal: "bg-transparent rounded-lg",
  };

  return (
    <div
      onClick={onClick}
      className={`${variants[variant]} p-5 transition-all cursor-pointer`}
    >
      {Icon && <div className="mb-3 text-red-700">{<Icon size={24} />}</div>}
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-gray-600 mt-2 text-sm">{subtitle}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}