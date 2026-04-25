import { Star } from "lucide-react";

export default function Rating({ value, max = 5, size = 16, interactive = false, onChange = null }) {
  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          className={`hover:scale-110 active:scale-90 transition-transform ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-700">{value.toFixed(1)}</span>
    </div>
  );
}
