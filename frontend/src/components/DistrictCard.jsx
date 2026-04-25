import { useNavigate } from "react-router-dom";

export default function DistrictCard({ province, title, stays, img }) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/stays?district=${encodeURIComponent(title)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
    >
      <img
        src={img}
        alt={title}
        className="w-full h-64 object-cover group-hover:scale-115 transition-transform duration-400"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-black/30 transition-all duration-300" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <span className="inline-flex w-fit text-xs uppercase tracking-widest bg-red-700/80 px-3 py-1 rounded-full font-semibold mb-3 group-hover:bg-red-600 transition-colors">
          {province}
        </span>

        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm mt-2 opacity-90">{stays}</p>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Explore <span className="text-lg">→</span>
        </div>
      </div>
    </div>
  );
}
